import json
from ai.llm_client import call_llm_json


async def generate_hacker_simulation(
    findings: list,
    domain: str,
    business_type: str = "Small Business",
    estimated_customers: int = 1000,
) -> dict:
    vulnerabilities = [f for f in findings if f.get("status") in ("critical", "warning")]

    system = """You are creating an educational hacker simulation terminal for a cybersecurity app.
Generate realistic terminal output showing how a hacker would attack this specific domain.
Use real Linux commands, real hacking tools (nmap, sqlmap, metasploit, hydra, etc.).
Use Indian rupee amounts for damage estimates. Make it dramatic but educational.
Respond ONLY with valid JSON."""

    vuln_summary = [{"check": v["check"], "status": v["status"]} for v in vulnerabilities[:5]]

    user = f"""Domain: {domain}
Business Type: {business_type}
Estimated Customers: {estimated_customers}
Vulnerabilities to exploit:
{json.dumps(vuln_summary, indent=2)}

Generate a hacker simulation JSON:
{{
  "simulation_title": "Dramatic title for this attack",
  "total_time_to_breach": "e.g. 3 hours 47 minutes",
  "total_damage_estimate": "₹X lakhs",
  "threat_actor": "e.g. Opportunistic Cybercriminal / State-Sponsored / Script Kiddie",
  "steps": [
    {{
      "timestamp": "HH:MM:SS",
      "command": "actual linux/kali command used",
      "output": "realistic terminal output (2-4 lines)",
      "vulnerability_exploited": "which finding is being abused",
      "status": "probing|success|critical",
      "commentary": "what this means in plain English"
    }}
  ],
  "final_message": "Scary but educational closing message to motivate fixing",
  "records_compromised": 500,
  "data_types_stolen": ["customer emails", "payment data", "order history"],
  "prevention_summary": "2-3 sentence summary of how to prevent this"
}}

Generate 7-10 steps. Make the commands realistic. Final step should show data exfiltration."""

    result = await call_llm_json(system, user)

    if not isinstance(result, dict) or "steps" not in result:
        return {
            "simulation_title": f"Attack Simulation: {domain}",
            "total_time_to_breach": "2-4 hours",
            "total_damage_estimate": "₹5-50 lakhs",
            "threat_actor": "Opportunistic Cybercriminal",
            "steps": [
                {
                    "timestamp": "00:00:01",
                    "command": f"nmap -sV -p- {domain}",
                    "output": "Starting Nmap scan...\nOpen ports detected",
                    "vulnerability_exploited": "Network exposure",
                    "status": "probing",
                    "commentary": "Hacker starts by mapping your attack surface",
                },
                {
                    "timestamp": "00:15:32",
                    "command": "metasploit > exploit/multi/handler",
                    "output": "[*] Started reverse TCP handler\n[*] Sending stage...",
                    "vulnerability_exploited": "Multiple vulnerabilities",
                    "status": "critical",
                    "commentary": "Exploit launched successfully",
                },
            ],
            "final_message": "Your vulnerabilities have been exploited. Fix them before real hackers do.",
            "records_compromised": estimated_customers // 2,
            "data_types_stolen": ["customer data", "emails", "payment info"],
            "prevention_summary": "Fixing the identified critical vulnerabilities would have prevented this breach.",
        }

    return result
