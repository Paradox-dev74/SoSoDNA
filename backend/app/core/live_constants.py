"""Shared live-data constants for SoDEX testnet integration."""

DEFAULT_SODEX_SYMBOL = "BTC-USD"
DEFAULT_SOSO_SYMBOL = "BTC"

SYMBOL_ALIASES = {
    "BTC-PERP": "BTC-USD",
    "ETH-PERP": "ETH-USD",
    "SOL-PERP": "SOL-USD",
}


def normalize_sodex_symbol(symbol: str) -> str:
    return SYMBOL_ALIASES.get(symbol.upper(), symbol)
