import { defineMcp } from "@lovable.dev/mcp-js";
import getTopCoins from "./tools/get-top-coins";
import getCoin from "./tools/get-coin";
import getNews from "./tools/get-news";

export default defineMcp({
  name: "crypto-gem-hunter-mcp",
  title: "Crypto Gem Hunter",
  version: "0.1.0",
  instructions:
    "Tools for exploring crypto markets and news. Use `get_top_coins` to list coins by market cap, `get_coin` to look up specific coins by CoinGecko id, and `get_crypto_news` for the latest headlines.",
  tools: [getTopCoins, getCoin, getNews],
});
