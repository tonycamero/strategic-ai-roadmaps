# Production Transfer Model

The Production Transfer Model tracks inventory movement through production
pipelines.

Transfers must remain consistent with both inventory records and production
schedules.

---

## Transfer Types

brew_transfer

Movement between brewing vessels.

---

tank_assignment

Allocation of product to fermentation or conditioning tanks.

---

packaging_transfer

Movement from production tanks to packaging runs.

---

repack_transfer

Movement between packaging formats.

Example:

keg → cans  
bottle → case  

---

## Transfer Record

Fields:

transfer_id
source_location
destination_location
sku
quantity
timestamp
transfer_type

---

## Validation Rules

Transfers must satisfy:

inventory balance constraints  
valid production stage progression  
matching ERP inventory updates  

---

## Divergence Conditions

Divergence occurs when:

transfer quantity exceeds available inventory  
transfer destination is invalid  
ERP records do not reflect transfer  

When detected:

production_transfer_divergence_event is emitted.

---

## Output Signals

production_transfer_signal  
production_transfer_divergence_event