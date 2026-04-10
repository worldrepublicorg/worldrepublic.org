import { defineChain } from "viem";
import { mainnet } from "wagmi/chains";

export const worldChain = defineChain({
  id: 480,
  name: "World Chain",
  network: "worldchain",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        "https://worldchain-mainnet.g.alchemy.com/public",
        "https://480.rpc.thirdweb.com",
        "https://worldchain.drpc.org",
        "https://sparkling-autumn-dinghy.worldchain-mainnet.quiknode.pro",
        "https://worldchain-mainnet.gateway.tenderly.co",
      ],
    },
    public: {
      http: [
        "https://worldchain-mainnet.g.alchemy.com/public",
        "https://480.rpc.thirdweb.com",
        "https://worldchain.drpc.org",
        "https://sparkling-autumn-dinghy.worldchain-mainnet.quiknode.pro",
        "https://worldchain-mainnet.gateway.tenderly.co",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Worldscan",
      url: "https://worldscan.org",
    },
  },
});

export const walletAuthChains = [mainnet, worldChain] as const;
