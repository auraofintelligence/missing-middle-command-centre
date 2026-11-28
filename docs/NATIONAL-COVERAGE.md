# National coverage and population

Open [National Coverage](https://missing-middle-command-centre.auraofintelligence.workers.dev/coverage) from Programme or Places and outreach. It can be used before creating a project or identifying a candidate site.

- **National overview** has a population map with zoom, pan and fit controls, state and territory filters, postcode or prefix search and CSV export. Click a register heading to sort and click it again to reverse the order. Apply returns to the filters; sorting returns to the register.
- **10,000 and over** shows Postal Areas with at least 10,000 residents in the 2021 Census and starts with the largest first. The map, register and CSV share the filter.
- **Smaller areas** filters known 2021 populations below 10,000 and starts with the smallest first. Use the scale or exact cutoff down to zero, then select areas for a shared catchment comparison. An individual postcode does not require a rack.
- **Compare a catchment** calculates a group of four digit codes. Each code counts once and missing matches remain visible.
- **Saved catchments** supports Webmaster edits, a combined footprint that removes overlaps, and signed revision history. The fictional demonstration has the public reference data and calculator without private catchment access.

## Sources

| Item | Source and result |
| --- | --- |
| Population | ABS 2021 Census General Community Profile Postal Area DataPack, G01 field `Tot_P_P`, usual residence |
| Geography | ABS ASGS Edition 3 GDA2020 Postal Area and State and Territory shapefiles, 2021 boundaries |
| Published Census total | 25,422,788 people |
| Imported mapped areas | 2,641 areas, 25,369,823 people |
| Non-geographic rows | 9494 and 9797 are retained in source metadata without a mapped area. The sum of published area counts and the published national total can differ due to Census perturbation. |
| Boundaries | State and territory filters reflect geometric overlap. A border area can appear in both filters. The national register counts it once. Four offshore areas are in the register outside the main map frame. |

Australia Post maintains delivery codes. This geographic register covers every mapped 2021 ABS Postal Area. A postal code can lack a population match, including PO boxes and codes not represented by that Census geography. Retain leading zeroes. In spreadsheet software, import the CSV code column as text.

## Planning arithmetic

Inputs default to a national scenario of 30 million people and 10,000 residents per rack, or 3,000 rack equivalents. The model scales each area's 2021 share of the published national Census count to the scenario population. It reports fractional rack equivalents and leaves the gap outside the mapped Census total unallocated. The 30 million scenario is a planning assumption. It does not make a claim about current population, local growth rates, funding or installation commitments.

## Rebuild

Install `pyshp==2.3.1` and `shapely==2.1.2`; run `python tools/build_coverage.py`; then run `node --test`. The build downloads the original official archives, records their SHA-256 digests, and writes `src/coverage-data.mjs`. Apply migration `0004_coverage_catchments.sql` before enabling the private routes. Actual catchment drafts and history are kept in the application database.

Source: Australian Bureau of Statistics, [2021 Census DataPacks](https://www.abs.gov.au/census/find-census-data/datapacks) and [ASGS Edition 3 boundaries](https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs/edition-3-july-2021-june-2026/access-and-downloads/digital-boundary-files), CC BY 4.0. Map display points and outlines are derived.
