# Integration specification

## Flight data

The public site must never invent live flight data.

### Accepted sources
1. Official airport AODB / FIDS feed
2. Official airline operational feed
3. Approved manual override workflow for temporary continuity

### Required normalized fields
- airline
- flight number
- route
- scheduled time
- estimated or updated time
- remarks / status
- provider label
- source timestamp
- fetched timestamp

### Public rendering rules
- show last-updated timestamp
- identify the provider
- show stale / unavailable states honestly
- never infer delay causes

## Weather data

The public site must never invent live weather.

### Accepted sources
- official weather provider
- approved public weather bulletin source

### Required normalized fields
- summary
- visibility
- temperature
- provider label
- source timestamp
- warning level
