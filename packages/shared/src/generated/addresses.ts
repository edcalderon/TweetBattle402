import deployment from "./deployment.json";

const deployedAddress = deployment.address as `0x${string}`;

export const CONTRACT_ADDRESSES: Record<number, `0x${string}` | undefined> = {
  10143:
    (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` | undefined) ??
    deployedAddress,
};
