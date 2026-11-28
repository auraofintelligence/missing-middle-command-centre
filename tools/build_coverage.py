"""Build the versioned national population layer from the original ABS archives."""
from csv import DictReader
from hashlib import file_digest
from io import BytesIO, TextIOWrapper
from json import dumps
from pathlib import Path
from re import fullmatch, search
from tempfile import TemporaryDirectory
from urllib.request import Request, urlopen
from zipfile import ZipFile

import shapefile
from shapely import make_valid
from shapely.geometry import shape
from shapely.prepared import prep

ROOT = Path(__file__).resolve().parents[1]
BOUNDARIES = (
    "https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs/"
    "edition-3-july-2021-june-2026/access-and-downloads/digital-boundary-files/"
)
SOURCES = {
    "census": "https://www.abs.gov.au/census/find-census-data/datapacks/download/2021_GCP_POA_for_AUS_short-header.zip",
    "areas": BOUNDARIES + "POA_2021_AUST_GDA2020_SHP.zip",
    "states": BOUNDARIES + "STE_2021_AUST_SHP_GDA2020.zip",
}
STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT", "OT"]
CENSUS_NATIONAL_TOTAL = 25422788


def fetch(destination, url):
    import shutil

    print(f"Downloading {url}", flush=True)
    request = Request(url, headers={"User-Agent": "Missing-Middle-Coverage/1.0 (ABS open data)"})
    with urlopen(request, timeout=180) as response, destination.open("wb") as file:
        shutil.copyfileobj(response, file)
    with destination.open("rb") as file:
        return file_digest(file, "sha256").hexdigest()


def code(value):
    raw = value.strip().upper()
    return raw[3:] if raw.startswith("POA") else raw


def populations(archive):
    with ZipFile(archive) as zipped:
        for name in zipped.namelist():
            if not search(r"(?:^|_)G01[A-Z]?_", name, flags=2) or not name.lower().endswith(".csv"):
                continue
            with TextIOWrapper(zipped.open(name), encoding="utf-8-sig") as stream:
                reader = DictReader(stream)
                fields = reader.fieldnames or []
                key = next((field for field in fields if search(r"POA", field, flags=2)), None)
                if not key or "Tot_P_P" not in fields:
                    continue
                results = {}
                for row in reader:
                    identifier = code(row[key])
                    value = row["Tot_P_P"].strip()
                    if not identifier or not value:
                        continue
                    if identifier in results:
                        raise ValueError(f"Duplicate Census area {identifier}")
                    count = int(value)
                    if count < 0:
                        raise ValueError(f"Negative population {identifier}")
                    results[identifier] = count
                print(f"{name}: {len(results):,} population rows", flush=True)
                return results, name
    raise ValueError("G01 usual-resident Total Persons field was not found")


def features(archive, key_prefix):
    with ZipFile(archive) as zipped:
        shp_name = next(n for n in zipped.namelist() if n.lower().endswith(".shp"))
        base = shp_name[:-4]
        with shapefile.Reader(**{ext: BytesIO(zipped.read(base + "." + ext)) for ext in ("shp", "shx", "dbf")}) as reader:
            key = next(field[0] for field in reader.fields if field[0].upper().startswith(key_prefix))
            for feature in reader.iterShapeRecords():
                identifier = str(feature.record.as_dict()[key]).strip()
                if feature.shape.shapeType == shapefile.NULL:
                    yield identifier, None
                else:
                    geometry = shape(feature.shape.__geo_interface__)
                    yield identifier, geometry if geometry.is_valid else make_valid(geometry)


def point(lon, lat):
    return round((lon - 112.0) * 18 + 10), round((-9.0 - lat) * 17 + 10)


def visible(lon, lat):
    return 112 <= lon <= 154.5 and -44.5 <= lat <= -9


def polygons(geom):
    if geom.geom_type == "Polygon":
        yield geom
    elif hasattr(geom, "geoms"):
        for item in geom.geoms:
            yield from polygons(item)


def outline(geom):
    rings = []
    for poly in polygons(geom.simplify(0.10, preserve_topology=True)):
        if poly.area < 0.015 or not visible(poly.centroid.x, poly.centroid.y):
            continue
        for ring in [poly.exterior, *poly.interiors]:
            pts = [point(x, y) for x, y in ring.coords]
            if len(set(pts)) >= 3:
                rings.append("M" + "L".join(f"{x},{y}" for x, y in pts) + "Z")
    return "".join(rings)


def build(directory):
    hashes = {name: fetch(directory / (name + ".zip"), url) for name, url in SOURCES.items()}
    people, table = populations(directory / "census.zip")
    regions = {
        STATES[int(key) - 1]: geom.simplify(0.002, preserve_topology=True)
        for key, geom in features(directory / "states.zip", "STE_CODE")
        if geom is not None and key.isdigit() and 1 <= int(key) <= len(STATES)
    }
    if not all(name in regions for name in STATES[:8]):
        raise ValueError("Missing state geometry")
    prepared = {name: prep(geom) for name, geom in regions.items()}

    rows = {}
    for key, geom in features(directory / "areas.zip", "POA_CODE"):
        if not fullmatch(r"[0-9]{4}", key) or geom is None or geom.is_empty or geom.area <= 0:
            continue
        if key in rows:
            raise ValueError(f"Duplicate Postal Area {key}")
        centre = geom.representative_point()
        plotted = list(point(centre.x, centre.y)) if visible(centre.x, centre.y) else [None, None]
        region_mask = 0
        for i, name in enumerate(STATES):
            if name in prepared and (
                prepared[name].covers(centre)
                or (prepared[name].intersects(geom) and regions[name].intersection(geom).area > geom.area * 0.005)
            ):
                region_mask |= 1 << i
        rows[key] = [key, people.get(key), *plotted, region_mask]
    matched = sum(row[1] is not None for row in rows.values())
    subtotal = sum(row[1] for row in rows.values() if row[1] is not None)
    if not 2500 <= len(rows) <= 2800 or matched < 2500 or not 24_000_000 < subtotal < 26_000_000:
        raise ValueError(f"Unexpected coverage: {len(rows)} mapped, {matched} counts, {subtotal:,} people")
    if not any(key.startswith("0") for key in rows):
        raise ValueError("Postal Areas with leading zeroes were lost")
    metadata = {
        "version": "abs-poa-2021-g01-v1",
        "referenceYear": 2021,
        "nationalPopulation": CENSUS_NATIONAL_TOTAL,
        "mappedPopulation": subtotal,
        "matched": matched,
        "areaCount": len(rows),
        "notOnMap": sum(row[2] is None for row in rows.values()),
        "censusRowsOutsideMappedAreas": {key: count for key, count in sorted(people.items()) if key not in rows},
        "table": table,
        "sources": SOURCES,
        "sha256": hashes,
    }
    dump = lambda x: dumps(x, ensure_ascii=True, separators=(",", ":"))
    content = (
        "// Generated by tools/build_coverage.py using ABS Census and ASGS Edition 3; CC BY 4.0.\n"
        f"export const coverageMeta = {dump(metadata)};\n"
        f"export const regionNames = {dump(STATES)};\n"
        f"export const regionPaths = {dump({key: outline(geom) for key, geom in regions.items()})};\n"
        f"export const postalAreas = {dump([rows[key] for key in sorted(rows)])};\n"
    )
    (ROOT / "src" / "coverage-data.mjs").write_text(content, encoding="utf-8")
    print(dumps(metadata, indent=2), flush=True)


if __name__ == "__main__":
    with TemporaryDirectory() as temp:
        build(Path(temp))
