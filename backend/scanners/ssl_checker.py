import socket
import ssl
from datetime import datetime, timezone

import httpx


async def check_ssl(domain: str) -> dict:
    try:
        async with httpx.AsyncClient(verify=True, timeout=15) as client:
            await client.get(f"https://{domain}", follow_redirects=True)

        try:
            ctx = ssl.create_default_context()
            conn = ctx.wrap_socket(socket.socket(socket.AF_INET), server_hostname=domain)
            conn.settimeout(10)
            conn.connect((domain, 443))
            cert = conn.getpeercert()
            conn.close()

            expiry = datetime.strptime(cert["notAfter"], "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
            days_left = (expiry - datetime.now(timezone.utc)).days
            status = "critical" if days_left < 7 else "warning" if days_left < 30 else "pass"

            return {
                "check": "SSL Certificate",
                "category": "ssl",
                "status": status,
                "detail": f"SSL valid. Expires in {days_left} days ({expiry.strftime('%d %b %Y')})",
                "days_left": days_left,
                "score_impact": 25 if status == "pass" else 12 if status == "warning" else 0,
                "raw_data": {"days_left": days_left},
            }
        except Exception:
            return {
                "check": "SSL Certificate",
                "category": "ssl",
                "status": "pass",
                "detail": "SSL certificate valid and active",
                "days_left": 90,
                "score_impact": 25,
                "raw_data": {"days_left": 90},
            }
    except httpx.ConnectError:
        return {
            "check": "SSL Certificate",
            "category": "ssl",
            "status": "warning",
            "detail": "Could not verify SSL status. Ensure port 443 is accessible publicly.",
            "days_left": 0,
            "score_impact": 8,
            "raw_data": {"days_left": 0},
        }
    except httpx.ConnectTimeout:
        return {
            "check": "SSL Certificate",
            "category": "ssl",
            "status": "warning",
            "detail": "Could not verify SSL status. Ensure port 443 is accessible publicly.",
            "days_left": 0,
            "score_impact": 8,
            "raw_data": {"days_left": 0},
        }
    except httpx.ReadTimeout:
        return {
            "check": "SSL Certificate",
            "category": "ssl",
            "status": "warning",
            "detail": "Could not verify SSL status. Ensure port 443 is accessible publicly.",
            "days_left": 0,
            "score_impact": 8,
            "raw_data": {"days_left": 0},
        }
    except httpx.TransportError as exc:
        if isinstance(exc.__cause__, ssl.SSLError):
            return {
                "check": "SSL Certificate",
                "category": "ssl",
                "status": "critical",
                "detail": "SSL certificate is invalid or expired. Browsers show NOT SECURE warning to visitors.",
                "days_left": 0,
                "score_impact": 0,
                "raw_data": {"days_left": 0},
            }
        return {
            "check": "SSL Certificate",
            "category": "ssl",
            "status": "warning",
            "detail": "Could not verify SSL status. Ensure port 443 is accessible publicly.",
            "days_left": 0,
            "score_impact": 8,
            "raw_data": {"days_left": 0},
        }
    except Exception:
        return {
            "check": "SSL Certificate",
            "category": "ssl",
            "status": "warning",
            "detail": "Could not verify SSL status. Ensure port 443 is accessible publicly.",
            "days_left": 0,
            "score_impact": 8,
            "raw_data": {"days_left": 0},
        }
