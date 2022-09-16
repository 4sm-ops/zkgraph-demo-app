import { SessionAccount, createSession } from "@argent/x-sessions"
import { FC, useEffect, useState } from "react"
import { Abi, AccountInterface, Contract } from "starknet"
import { genKeyPair, getStarkKey } from "starknet/dist/utils/ellipticCurve"

import Erc20Abi from "../../abi/ERC20.json"
import { truncateAddress, truncateHex } from "../services/address.service"
import {
  getErc20TokenAddress,
  mintToken,
  parseInputAmountToUint256,
  transfer,
  followProfile,
  createProfile
} from "../services/token.service"
import {
  addToken,
  getExplorerBaseUrl,
  networkId,
  signMessage,
  waitForTransaction,
} from "../services/wallet.service"
import styles from "../styles/Home.module.css"
import Neo4j from "./Neo4j"

type Status = "idle" | "approve" | "pending" | "success" | "failure"

export const TokenDapp: FC<{
  showSession: null | boolean
  account: AccountInterface
}> = ({ showSession, account }) => {
  const [mintAmount, setMintAmount] = useState("10")
  const [profileHandle, setProfileHandle] = useState(".stark")
  const [profileID, setProfileIDToFollow] = useState("1")
  const [transferTo, setTransferTo] = useState("")
  const [transferAmount, setTransferAmount] = useState("1")
  const [shortText, setShortText] = useState("")
  const [lastSig, setLastSig] = useState<string[]>([])
  const [lastTransactionHash, setLastTransactionHash] = useState("")
  const [transactionStatus, setTransactionStatus] = useState<Status>("idle")
  const [transactionError, setTransactionError] = useState("")
  const [addTokenError, setAddTokenError] = useState("")

  const [sessionSigner] = useState(genKeyPair())
  const [sessionAccount, setSessionAccount] = useState<
    SessionAccount | undefined
  >()

  const buttonsDisabled = ["approve", "pending"].includes(transactionStatus)

  useEffect(() => {
    ;(async () => {
      if (lastTransactionHash && transactionStatus === "pending") {
        setTransactionError("")
        try {
          await waitForTransaction(lastTransactionHash)
          setTransactionStatus("success")
        } catch (error: any) {
          setTransactionStatus("failure")
          let message = error ? `${error}` : "No further details"
          if (error?.response) {
            message = JSON.stringify(error.response, null, 2)
          }
          setTransactionError(message)
        }
      }
    })()
  }, [transactionStatus, lastTransactionHash])

  const network = networkId()
  if (network !== "goerli-alpha" && network !== "mainnet-alpha") {
    return (
      <>
        <p>
          There is no demo token for this network, but you can deploy one and
          add its address to this file:
        </p>
        <div>
          <pre>packages/dapp/src/token.service.ts</pre>
        </div>
      </>
    )
  }

  const handleMintSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setTransactionStatus("approve")

      console.log("mint", mintAmount)
      const result = await mintToken(mintAmount, network)
      console.log(result)

      setLastTransactionHash(result.transaction_hash)
      setTransactionStatus("pending")
    } catch (e) {
      console.error(e)
      setTransactionStatus("idle")
    }
  }

  const handleFollowSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setTransactionStatus("approve")

      console.log("mint", profileID)
      const result = await followProfile(profileID, network)
      console.log(result)

      setLastTransactionHash(result.transaction_hash)
      setTransactionStatus("pending")
    } catch (e) {
      console.error(e)
      setTransactionStatus("idle")
    }
  }  

  const handleCreateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setTransactionStatus("approve")

      console.log("mint", profileHandle)
      const result = await createProfile(profileHandle, network)
      console.log(result)

      setLastTransactionHash(result.transaction_hash)
      setTransactionStatus("pending")
    } catch (e) {
      console.error(e)
      setTransactionStatus("idle")
    }
  } 

  

  const handleTransferSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault()
      setTransactionStatus("approve")

      console.log("transfer", { transferTo, transferAmount })
      const result = await transfer(transferTo, transferAmount, network)
      console.log(result)

      setLastTransactionHash(result.transaction_hash)
      setTransactionStatus("pending")
    } catch (e) {
      console.error(e)
      setTransactionStatus("idle")
    }
  }

  const handleSignSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault()
      setTransactionStatus("approve")

      console.log("sign", shortText)
      const result = await signMessage(shortText)
      console.log(result)

      setLastSig(result)
      setTransactionStatus("success")
    } catch (e) {
      console.error(e)
      setTransactionStatus("idle")
    }
  }

  const handleOpenSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const signedSession = await createSession(
      {
        key: getStarkKey(sessionSigner),
        expires: Math.floor((Date.now() + 1000 * 60 * 60 * 24) / 1000), // 1 day in seconds
        policies: [
          {
            contractAddress: getErc20TokenAddress(network),
            selector: "mint",
          },
        ],
      },
      account,
    )

    setSessionAccount(
      new SessionAccount(
        account,
        account.address,
        sessionSigner,
        signedSession,
      ),
    )
  }

  const handleSessionTransactionSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault()
      if (!sessionAccount) {
        throw new Error("No open session")
      }
      const erc20Contract = new Contract(
        Erc20Abi as Abi,
        getErc20TokenAddress(network),
        sessionAccount,
      )

      const result = await erc20Contract.mint(
        account.address,
        parseInputAmountToUint256("666"),
      )
      console.log(result)

      setLastTransactionHash(result.transaction_hash)
      setTransactionStatus("pending")
    } catch (e) {
      console.error(e)
      setTransactionStatus("idle")
    }
  }
  const tokenAddress = getErc20TokenAddress(network as any)
  const ethAddress =
    network === "goerli-alpha"
      ? "0x2dd93e385742984bf2fc887cd5d8b5ec6917d80af09cf7a00a63710ad51ba53"
      : undefined

  return (
    <>
      <h3 style={{ margin: 0 }}>
        Transaction status: <code>{transactionStatus}</code>
      </h3>
      {lastTransactionHash && (
        <h3 style={{ margin: 0 }}>
          Transaction hash:{" "}
          <a
            href={`${getExplorerBaseUrl()}/tx/${lastTransactionHash}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: "blue", margin: "0 0 1em" }}
          >
            <code>{truncateHex(lastTransactionHash)}</code>
          </a>
        </h3>
      )}
      {transactionError && (
        <h3 style={{ margin: 0 }}>
          Transaction error:{" "}
          <textarea
            style={{ width: "100%", height: 100, background: "white" }}
            value={transactionError}
            readOnly
          />
        </h3>
      )}
      <div className="columns">
        <form onSubmit={handleCreateProfileSubmit}>
          <h2 className={styles.title}>Create Profile NFT</h2>
          <label htmlFor="mint-amount">Choose your Profile NFT</label>
          <input
            type="text"
            id="profile-nft-handle"
            name="fname"
            value={profileHandle}
            onChange={(e) => setProfileHandle(e.target.value)}
          />
          <input type="submit" disabled={buttonsDisabled} value="Create Profile NFT" />
        </form>
      </div>
      <div className="columns">
        <form onSubmit={handleFollowSubmit}>
          <h2 className={styles.title}>Follow other zkGraph User</h2>
          <label htmlFor="mint-amount">Choose Profile ID to follow</label>
          <input
            type="text"
            id="profile-nft-id"
            name="fname"
            value={profileID}
            onChange={(e) => setProfileIDToFollow(e.target.value)}
          />
          <input type="submit" disabled={buttonsDisabled} value="Follow Profile ID" />
        </form>
      </div>
      <Neo4j />

      {showSession && (
        <div className="columns">
          <form onSubmit={handleOpenSessionSubmit}>
            <h2 className={styles.title}>Sessions</h2>

            <p>
              Random session signer:{" "}
              <code>{truncateHex(getStarkKey(sessionSigner))}</code>
            </p>

            <input
              type="submit"
              value="Open session"
              disabled={Boolean(sessionAccount)}
            />
          </form>
          <form onSubmit={handleSessionTransactionSubmit}>
            <h2 className={styles.title}>Open session</h2>

            <p>Mint some test tokens using the session!</p>

            <input
              type="submit"
              value="Use session"
              disabled={Boolean(!sessionAccount) || buttonsDisabled}
            />
          </form>
        </div>
      )}
      <h3 style={{ margin: 0 }}>
        ERC-20 token address
        <button
          className="flat"
          style={{ marginLeft: ".6em" }}
          onClick={async () => {
            try {
              await addToken(tokenAddress)
              setAddTokenError("")
            } catch (error: any) {
              setAddTokenError(error.message)
            }
          }}
        >
          Add to wallet
        </button>
        <br />
        <code>
          <a
            target="_blank"
            href={`${getExplorerBaseUrl()}/contract/${tokenAddress}`}
            rel="noreferrer"
          >
            {truncateAddress(tokenAddress)}
          </a>
        </code>
      </h3>
      {ethAddress && (
        <h3 style={{ margin: 0 }}>
          Goerli ETH token address
          <button
            className="flat"
            style={{ marginLeft: ".6em" }}
            onClick={async () => {
              try {
                await addToken(ethAddress)
                setAddTokenError("")
              } catch (error: any) {
                setAddTokenError(error.message)
              }
            }}
          >
            Add to wallet
          </button>
          <br />
          <code>
            <a
              target="_blank"
              href={`${getExplorerBaseUrl()}/contract/${ethAddress}`}
              rel="noreferrer"
            >
              {truncateAddress(ethAddress)}
            </a>
          </code>
        </h3>
      )}
      <span className="error-message">{addTokenError}</span>
    </>
  )
}
