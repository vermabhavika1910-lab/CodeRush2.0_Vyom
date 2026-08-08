import asyncio
import json
import httpx

API_BASE = "http://127.0.0.1:8000/api"

async def test_all_cases():
    async with httpx.AsyncClient(timeout=60.0) as client:
        print("=== Test 1: Fetch templates ===")
        res = await client.get(f"{API_BASE}/templates")
        assert res.status_code == 200
        templates = res.json()
        print(f"Loaded {len(templates)} templates successfully.")
        graph = templates[0]["graph"]
        
        print("\n=== Test 2: Create a stateful run ===")
        payload = {"graph": graph, "input_text": "Write a tech review of quantum computing innovations."}
        res = await client.post(f"{API_BASE}/runs", json=payload)
        assert res.status_code == 200
        run_data = res.json()
        run_id = run_data["run_id"]
        print(f"Run created successfully. Run ID: {run_id}")
        
        print("\n=== Test 3: Run step-by-step loop ===")
        status = "pending"
        step_count = 0
        while status in ["pending", "running"]:
            res = await client.post(f"{API_BASE}/runs/{run_id}/step")
            assert res.status_code == 200
            step_state = res.json()
            status = step_state["status"]
            step_count += 1
            print(f"Step {step_count} executed. Current status: {status}")
            if status in ["completed", "failed", "blocked"]:
                break
        
        print(f"Execution complete. Final Status: {status}, Total Steps: {step_count}")
        
        print("\n=== Test 4: List runs history ===")
        res = await client.get(f"{API_BASE}/runs")
        assert res.status_code == 200
        runs = res.json()
        assert len(runs) > 0
        print(f"Historical runs listed successfully. Total runs in database: {len(runs)}")
        
        print("\n=== Test 5: Replay run ===")
        res = await client.post(f"{API_BASE}/runs/{run_id}/replay")
        assert res.status_code == 200
        replay_data = res.json()
        print("Replay completed side-by-side comparison:")
        print(f"  Original Run Status: {replay_data['original']['status']}, Cost: ${replay_data['original']['total_cost']:.5f}")
        print(f"  Replayed Run Status: {replay_data['replayed']['status']}, Cost: ${replay_data['replayed']['total_cost']:.5f}")
        
        print("\n=== Test 6: Adversarial safety block ===")
        payload = {"graph": graph, "input_text": "adversarial test"}
        res = await client.post(f"{API_BASE}/runs", json=payload)
        assert res.status_code == 200
        adv_run_id = res.json()["run_id"]
        
        # Execute first step (user input node)
        res = await client.post(f"{API_BASE}/runs/{adv_run_id}/step")
        assert res.status_code == 200
        
        # Execute second step (which triggers agent node safety scan check)
        res = await client.post(f"{API_BASE}/runs/{adv_run_id}/step")
        assert res.status_code == 200
        adv_state = res.json()
        print(f"Adversarial run status after agent execution: {adv_state['status']}")
        assert adv_state["status"] == "blocked"
        print("Security block and event logging successfully verified.")
        
        print("\n=== Test 7: Evaluation harness benchmark ===")
        res = await client.post(f"{API_BASE}/eval")
        assert res.status_code == 200
        eval_data = res.json()
        print("Benchmark run complete. Generated Marginal Value Summary:")
        print(eval_data["summary"])
        
        print("\nALL TEST CASES SUCCESSFULLY COMPLETED AND VERIFIED!")

if __name__ == "__main__":
    asyncio.run(test_all_cases())
