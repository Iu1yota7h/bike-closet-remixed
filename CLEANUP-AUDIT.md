# Catalog cleanup audit — September 9, 2026

Audited the saved snapshot, not a new inventory fetch: 3,915 rows, including 2,053 in-stock options. Counts below compare shared cleanup output before and after this change.

| Finding | Correction | In-stock options affected |
| --- | --- | ---: |
| Sizes embedded in combined glove fields or product titles were absent from filters | Extract explicit sizes while preserving retailer detail | 103 |
| Rapha XLG remained separate from XL | Normalize filter label to XL; retain XLG in listing | 20 |
| Jackets classified as jerseys, a saddle bag as a saddle, and CO2 inflators as bags | Give specific product identity precedence over category tags | 21 |
| WMNS abbreviation missed | Classify Gibraltar Vest WMNS as Women's | 1 |

The category corrections cover four Assos jacket models, POC Ultra Saddle Bag 7L, and two Silca EOLO IV color listings. Garmin Edge 850 was also classified for future restocks; it remains hidden while out of stock. Manufacturer references are in CATALOG-CLEANUP.md.

After cleanup, all current rows have a product category. No duplicate row IDs or negative/non-finite non-null prices were found. No HTML entity remnants were found in in-stock names or variant descriptions after text cleanup. The only remaining missing size among in-stock clothing, socks, shoes, helmets and tires is Assos DIMENSION DATA Cap; no size is stated, so it remains unknown. Component compatibility dimensions were not inferred from arbitrary model numbers. Similar names with different retailer IDs were not merged.

Regression coverage includes mixed color/size glove fields, youth sizes, title-only tire/helmet/shoe/clothing sizes, structured-size precedence, WMNS, category overrides and preservation of ASSOS sizing. These checks run with the existing daily cleanup process.
