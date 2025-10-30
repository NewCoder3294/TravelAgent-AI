"""Example script to test the Trip Planner API."""

import asyncio
import httpx
import json
from datetime import datetime, timedelta


async def test_trip_search():
    """Test the trip search API with an example request."""

    # API configuration
    base_url = "http://localhost:4000"

    # Create example search request
    today = datetime.now()
    start_date = (today + timedelta(days=30)).strftime("%Y-%m-%d")
    end_date = (today + timedelta(days=35)).strftime("%Y-%m-%d")

    request_data = {
        "origin": "SAN",  # San Diego
        "date_range": {"start": start_date, "end": end_date},
        "budget": 1500,
        "preferences": {"include_activities": True, "max_flight_hours": 10},
    }

    print("🔍 Starting trip search...")
    print(f"📍 Origin: {request_data['origin']}")
    print(f"📅 Dates: {start_date} to {end_date}")
    print(f"💰 Budget: ${request_data['budget']}")
    print()

    async with httpx.AsyncClient() as client:
        # Step 1: Create search job
        print("1️⃣  Creating search job...")
        response = await client.post(f"{base_url}/api/v1/trips/search", json=request_data)

        if response.status_code != 200:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            return

        job_data = response.json()
        job_id = job_data["job_id"]
        print(f"✅ Job created: {job_id}")
        print()

        # Step 2: Poll for status updates
        print("2️⃣  Polling for status updates...")
        max_attempts = 60  # 60 seconds timeout
        attempt = 0

        while attempt < max_attempts:
            response = await client.get(f"{base_url}/api/v1/trips/status/{job_id}")
            status_data = response.json()

            progress = status_data["progress"]
            message = status_data["message"]
            status = status_data["status"]

            print(f"   Progress: {progress}% - {message}")

            if status == "completed":
                print()
                print("✅ Search completed!")
                break
            elif status == "failed":
                print()
                print("❌ Search failed!")
                return

            await asyncio.sleep(1)
            attempt += 1

        if attempt >= max_attempts:
            print("⏱️  Timeout waiting for results")
            return

        # Step 3: Get final results
        print()
        print("3️⃣  Fetching results...")
        response = await client.get(f"{base_url}/api/v1/trips/results/{job_id}")
        results = response.json()

        # Display results
        print()
        print("=" * 80)
        print("TRIP SEARCH RESULTS - HUB & SPOKE VISUALIZATION")
        print("=" * 80)
        print()

        # Show hub information
        hub = results["hub"]
        print(f"🏠 HUB (Origin):")
        print(f"   {hub['city']}, {hub['country']} ({hub['airport_code']})")
        print(f"   📍 Coordinates: {hub['coordinates']['lat']}, {hub['coordinates']['lng']}")
        print()

        # Show map bounds
        bounds = results["map_bounds"]
        print(f"🗺️  MAP VIEWPORT:")
        print(f"   Bounds: N{bounds['north']}, S{bounds['south']}, E{bounds['east']}, W{bounds['west']}")
        print(f"   Recommended Zoom: {results['recommended_zoom']}")
        print()

        metadata = results["search_metadata"]
        print(f"📊 SEARCH SUMMARY:")
        print(f"   Total searched: {metadata['total_searched']} destinations")
        print(f"   Feasible (within budget): {metadata['feasible_count']} destinations")
        print(f"   Execution time: {metadata['execution_time']:.2f}s")
        print()
        print("=" * 80)
        print()

        routes = results["routes"]
        if not routes:
            print("No routes found within budget.")
            return

        print(f"✈️  ROUTES FROM {hub['city']}:")
        print()

        for idx, route in enumerate(routes[:10], 1):
            status_emoji = "✅" if route["is_feasible"] else "❌"
            print(f"{idx}. {status_emoji} {route['city']}, {route['country']} ({route['airport']})")
            print(f"   Distance: {route['route_path']['distance_km']} km ({route['route_path']['flight_duration']})")
            print(f"   Status: {'WITHIN BUDGET' if route['is_feasible'] else 'OVER BUDGET'}")
            print(f"   Total Cost: ${route['total_cost']:.2f}")
            print(f"   Remaining: ${route['remaining_budget']:.2f}")
            print()
            print(f"   💰 Cost Breakdown:")
            print(f"      Flight:        ${route['breakdown']['flight']:>7.2f}")
            print(f"      Accommodation: ${route['breakdown']['accommodation']:>7.2f}")
            print(f"      Food:          ${route['breakdown']['food']:>7.2f}")
            print(f"      Attractions:   ${route['breakdown']['attractions']:>7.2f}")
            print()
            if route["ai_insights"]:
                print(f"   💡 AI Insights:")
                # Wrap text to 70 characters
                insights = route['ai_insights']
                if len(insights) > 70:
                    print(f"      {insights[:70]}...")
                else:
                    print(f"      {insights}")
            if route["savings_tips"]:
                print(f"   💸 Money-Saving Tips:")
                for tip in route["savings_tips"][:2]:
                    print(f"      • {tip}")
            if route["warnings"]:
                print(f"   ⚠️  Warnings:")
                for warning in route["warnings"]:
                    print(f"      • {warning}")
            print()
            print(f"   🗺️  Route Path: ({route['route_path']['start']['lat']}, {route['route_path']['start']['lng']}) → ({route['route_path']['end']['lat']}, {route['route_path']['end']['lng']})")
            print()
            print("-" * 80)
            print()


if __name__ == "__main__":
    print()
    print("╔════════════════════════════════════════════════════════════════════════════╗")
    print("║                    TRIP PLANNER API - TEST SCRIPT                          ║")
    print("╚════════════════════════════════════════════════════════════════════════════╝")
    print()

    try:
        asyncio.run(test_trip_search())
    except KeyboardInterrupt:
        print("\n⚠️  Interrupted by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
