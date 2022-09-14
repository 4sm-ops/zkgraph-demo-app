import { getStarknet } from "@argent/get-starknet"
import { utils } from "ethers"
import { Abi, Contract, number, uint256 } from "starknet"

import {Buffer} from 'buffer'

import Erc20Abi from "../../abi/ZKGraphHub.json"



export const erc20TokenAddressByNetwork = {
  "goerli-alpha":
    "0x02fa23eb9ec2912d2b81c7c6c4380f20bc7c9490fe9056d33b784ae6d52e10a3",
  "mainnet-alpha":
    "0x06a09ccb1caaecf3d9683efe335a667b2169a409d19c589ba1eb771cd210af75",
}

export type PublicNetwork = keyof typeof erc20TokenAddressByNetwork
export type Network = PublicNetwork | "localhost"

export const getErc20TokenAddress = (network: PublicNetwork) =>
  erc20TokenAddressByNetwork[network]

function getUint256CalldataFromBN(bn: number.BigNumberish) {
  return { type: "struct" as const, ...uint256.bnToUint256(bn) }
}

export function parseInputAmountToUint256(
  input: string,
  decimals: number = 0,
) {
  return getUint256CalldataFromBN(utils.parseUnits(input, decimals).toString())
}


export const createProfile = async (
  profileHandle: string,
  network: PublicNetwork,
): Promise<any> => {
  const starknet = getStarknet()
  if (!starknet?.isConnected) {
    throw Error("starknet wallet not connected")
  }
  const erc20Contract = new Contract(
    Erc20Abi as Abi,
    getErc20TokenAddress(network),
    starknet.account as any,
  )

  const profileHandleHex = "0x" + Buffer.from(profileHandle).toString('hex')

  const toAddress = starknet.selectedAddress

  const imageURI = profileHandleHex

  return erc20Contract.create_profile([toAddress, profileHandleHex, imageURI, 0, 0, 0])
}


export const followProfile = async (
  profileID: string,
  network: PublicNetwork,
): Promise<any> => {
  const starknet = getStarknet()
  if (!starknet?.isConnected) {
    throw Error("starknet wallet not connected")
  }
  const erc20Contract = new Contract(
    Erc20Abi as Abi,
    getErc20TokenAddress(network),
    starknet.account as any,
  )

  const address = starknet.selectedAddress

  return erc20Contract.follow(parseInputAmountToUint256(profileID))
}


export const mintToken = async (
  mintAmount: string,
  network: PublicNetwork,
): Promise<any> => {
  const starknet = getStarknet()
  if (!starknet?.isConnected) {
    throw Error("starknet wallet not connected")
  }
  const erc20Contract = new Contract(
    Erc20Abi as Abi,
    getErc20TokenAddress(network),
    starknet.account as any,
  )

  const address = starknet.selectedAddress

  return erc20Contract.mint(address, parseInputAmountToUint256(mintAmount))
}

export const transfer = async (
  transferTo: string,
  transferAmount: string,
  network: PublicNetwork,
): Promise<any> => {
  const starknet = getStarknet()
  if (!starknet?.isConnected) {
    throw Error("starknet wallet not connected")
  }

  const erc20Contract = new Contract(
    Erc20Abi as any,
    getErc20TokenAddress(network),
    starknet.account as any,
  )

  return erc20Contract.transfer(
    transferTo,
    parseInputAmountToUint256(transferAmount),
  )
}
