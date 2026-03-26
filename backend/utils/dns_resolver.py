import asyncio

import dns.resolver


def get_resolver():
    resolver = dns.resolver.Resolver(configure=False)
    resolver.nameservers = ["8.8.8.8", "8.8.4.4", "1.1.1.1", "1.0.0.1"]
    resolver.timeout = 8
    resolver.lifetime = 12
    return resolver


_resolver = get_resolver()


async def resolve_txt(domain: str) -> list[str]:
    loop = asyncio.get_event_loop()

    def _resolve():
        try:
            answers = _resolver.resolve(domain, "TXT")
            return [r.to_text().strip('"') for r in answers]
        except dns.resolver.NXDOMAIN:
            return []
        except dns.resolver.NoAnswer:
            return []
        except Exception:
            try:
                fresh = get_resolver()
                answers = fresh.resolve(domain, "TXT")
                return [r.to_text().strip('"') for r in answers]
            except Exception:
                return []

    return await loop.run_in_executor(None, _resolve)


async def resolve_a(domain: str) -> list[str]:
    loop = asyncio.get_event_loop()

    def _resolve():
        try:
            answers = _resolver.resolve(domain, "A")
            return [r.address for r in answers]
        except Exception:
            return []

    return await loop.run_in_executor(None, _resolve)


async def resolve_ns(domain: str) -> list[str]:
    loop = asyncio.get_event_loop()

    def _resolve():
        try:
            answers = _resolver.resolve(domain, "NS")
            return [str(r.target).rstrip(".") for r in answers]
        except Exception:
            return []

    return await loop.run_in_executor(None, _resolve)
