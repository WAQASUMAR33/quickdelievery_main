---
name: order_batching
description: Automated multi-order stacking, spatial filtering, and dispatch logic
---

# Order Batching and Dispatch Instructions

You must act as the automated dispatch engine for the delivery application. When the user initiates the dispatch mode, you must follow this exact pipeline:

## Step 1: Initialize the Pooling Window (Data Ingestion)
- Do not process orders immediately.
- Run a background check every 45 seconds to fetch all incoming orders with a status of `PENDING_DISPATCH` (or `PENDING`).
- Target Variables: Order ID, Restaurant Lat/Lng, Customer Delivery Lat/Lng, Prep Time.

## Step 2: Apply the Spatial Grid Filter (Geographic Grouping)
- Convert each restaurant's coordinate point into a spatial cell index (e.g. H3 Resolution 8 Hexagon or an S2 Cell).
- Isolate these geographic groups and process them completely independently.

## Step 3: Run the Time Window Alignment Check (Quality Control)
- Compare the estimated ready times of the orders in the same cell.
- Reject the batch if the difference in food prep time between Order A and Order B is > 7 minutes.
- If it passes, move the pair to sequencing.

## Step 4: Execute Route Path Sequencing
- Evaluate the 4 core points (Pickup 1, Pickup 2, Dropoff 1, Dropoff 2).
- Check the detour distance between Dropoff 1 and Dropoff 2.
- If detour > 3.5 km, separate them into single orders.
- If detour <= 3.5 km, arrange exactly as: Pickup 1 ──► Pickup 2 ──► Dropoff 1 ──► Dropoff 2.

## Step 5: Construct and Publish the JSON Output Payload
- Output the payload explicitly in this format:
```json
{
  "batch_assignment": {
    "type": "BATCHED_MULTIPLE",
    "total_orders": 2,
    "routing_steps": [
      { "step_index": 1, "action": "PICKUP", "target_order_id": "ORD-01", "location_name": "Vendor A" },
      { "step_index": 2, "action": "PICKUP", "target_order_id": "ORD-02", "location_name": "Vendor B" },
      { "step_index": 3, "action": "DELIVER", "target_order_id": "ORD-01", "location_name": "Customer A" },
      { "step_index": 4, "action": "DELIVER", "target_order_id": "ORD-02", "location_name": "Customer B" }
    ]
  }
}
```
