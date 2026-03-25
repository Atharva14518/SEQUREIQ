import asyncio
import socket


DANGEROUS_PORTS = {
    21: ("FTP", "warning", "FTP server exposed — unencrypted file transfer protocol"),
    22: ("SSH", "warning", "SSH port open — ensure strong keys, not passwords"),
    23: ("Telnet", "critical", "Telnet port open — sends all data in plain text, extremely dangerous"),
    25: ("SMTP", "warning", "SMTP port open — could be used for spam relay"),
    3306: ("MySQL", "critical", "MySQL database port exposed to internet — immediate risk of data theft"),
    5432: ("PostgreSQL", "warning", "PostgreSQL port accessible — should be behind firewall"),
    6379: ("Redis", "critical", "Redis port exposed — no authentication by default, data theft risk"),
    27017: ("MongoDB", "critical", "MongoDB port exposed — databases stolen globally via this vulnerability"),
    8080: ("HTTP-Alt", "warning", "Alternative HTTP port open — may expose dev/admin panels"),
    8443: ("HTTPS-Alt", "warning", "Alternative HTTPS port open — verify if intentional"),
}

CRITICAL_PORTS = {23, 3306, 27017, 6379}


async def check_ports(domain: str) -> list:
    loop = asyncio.get_event_loop()
    try:
        ip = await loop.run_in_executor(None, socket.gethostbyname, domain)
    except Exception:
        ip = domain

    tasks = [loop.run_in_executor(None, _check_port, ip, port) for port in DANGEROUS_PORTS]
    results_raw = await asyncio.gather(*tasks, return_exceptions=True)

    findings = []
    open_ports = []

    for port, res in zip(DANGEROUS_PORTS.keys(), results_raw):
        if isinstance(res, bool) and res:
            open_ports.append(port)
            name, sev, msg = DANGEROUS_PORTS[port]
            findings.append({
                "check": f"Open Port: {name} ({port})",
                "category": "network",
                "status": sev,
                "detail": msg,
                "score_impact": 0 if sev == "critical" else 3,
                "raw_data": {"port": port, "service": name, "ip": ip},
            })

    if not open_ports:
        findings.append({
            "check": "Network Ports",
            "category": "network",
            "status": "pass",
            "detail": "No dangerous ports exposed to the internet",
            "score_impact": 15,
            "raw_data": {"scanned_ports": list(DANGEROUS_PORTS.keys())},
        })

    return findings


def _check_port(host: str, port: int) -> bool:
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(3)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except Exception:
        return False
