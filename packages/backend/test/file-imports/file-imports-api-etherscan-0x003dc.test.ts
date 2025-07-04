import fs from "fs"
import { join } from "path"
import { countAuditLogs, getAuditLogs } from "src/api/account/audit-logs-api"
import { computeBalances, getBalances } from "src/api/account/balances-api"
import {
  countFileImports,
  deleteFileImport,
  getFileImports,
  importFile,
} from "src/api/account/file-imports-api"
import { computeTrades, getTrades, getTradesFullQuery } from "src/api/account/trades-api"
import {
  autoMergeTransactions,
  countTransactions,
  getTransactions,
} from "src/api/account/transactions-api"
import { ProgressUpdate } from "src/interfaces"
import { normalizeTransaction, sanitizeAuditLog } from "src/utils/test-utils"
import { beforeAll, describe, expect, it, vi } from "vitest"

const accountName = Math.random().toString(36).substring(7)

const mocks = vi.hoisted(() => {
  return {
    access: vi.fn().mockResolvedValue(true),
    readFile: vi.fn(),
  }
})

describe("should import 0x003dc via files", () => {
  beforeAll(async () => {
    vi.mock("fs/promises", () => ({
      ...fs.promises,
      access: mocks.access,
      readFile: mocks.readFile,
    }))
  })

  it("should add a file import", async () => {
    // arrange
    const fileName = "0x003dc/etherscan.csv"
    const filePath = join("test/files", fileName)
    const buffer = await fs.promises.readFile(filePath, "utf8")
    mocks.readFile.mockResolvedValue(buffer)
    // act
    const fileImport = await importFile(accountName, {
      createdBy: "user",
      id: 0,
      metadata: {
        lastModified: 0,
        size: buffer.length,
        type: "text/csv",
      },
      name: fileName,
      scheduledAt: 0,
      status: "completed",
    })
    const auditLogsCount = await countAuditLogs(
      accountName,
      `SELECT COUNT(*) FROM audit_logs WHERE fileImportId = ?`,
      [fileImport.id]
    )
    // assert
    delete fileImport.timestamp
    expect(fileImport).toMatchInlineSnapshot(`
      {
        "id": "2137860255",
        "lastModified": 0,
        "meta": {
          "assetIds": [
            "chain.ethereum:0x0000000000000000000000000000000000000000:ETH",
          ],
          "extensionId": "etherscan-file-import",
          "logs": 545,
          "operations": [
            "Deposit",
            "Fee",
            "Withdraw",
          ],
          "parserId": "etherscan-default",
          "platformId": "chain.ethereum",
          "rows": 482,
          "transactions": 482,
          "wallets": [
            "0x003dC32fE920a4aAeeD12dC87E145F030aa753f3",
          ],
        },
        "name": "0x003dc/etherscan.csv",
        "size": 137509,
      }
    `)
    expect(auditLogsCount).toMatchInlineSnapshot(`545`)
  })

  it("should add an internal file import", async () => {
    // arrange
    const fileName = "0x003dc/etherscan-internal.csv"
    const filePath = join("test/files", fileName)
    const buffer = await fs.promises.readFile(filePath, "utf8")
    mocks.readFile.mockResolvedValue(buffer)
    // act
    const fileImport = await importFile(accountName, {
      createdBy: "user",
      id: 0,
      metadata: {
        lastModified: 0,
        size: buffer.length,
        type: "text/csv",
      },
      name: fileName,
      scheduledAt: 0,
      status: "completed",
    })
    const auditLogsCount = await countAuditLogs(
      accountName,
      `SELECT COUNT(*) FROM audit_logs WHERE fileImportId = ?`,
      [fileImport.id]
    )
    // assert
    delete fileImport.timestamp
    expect(fileImport).toMatchInlineSnapshot(`
      {
        "id": "2523657605",
        "lastModified": 0,
        "meta": {
          "assetIds": [
            "chain.ethereum:0x0000000000000000000000000000000000000000:ETH",
            "chain.ethereum:0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2:WETH",
          ],
          "extensionId": "etherscan-file-import",
          "logs": 61,
          "operations": [
            "Deposit",
            "Withdraw",
          ],
          "parserId": "etherscan-internal",
          "platformId": "chain.ethereum",
          "rows": 48,
          "transactions": 48,
          "wallets": [
            "0x003dC32fE920a4aAeeD12dC87E145F030aa753f3",
          ],
        },
        "name": "0x003dc/etherscan-internal.csv",
        "size": 17933,
      }
    `)
    expect(auditLogsCount).toMatchInlineSnapshot(`61`)
  })

  it("should add an erc20 file import", async () => {
    // arrange
    const fileName = "0x003dc/etherscan-erc20.csv"
    const filePath = join("test/files", fileName)
    const buffer = await fs.promises.readFile(filePath, "utf8")
    mocks.readFile.mockResolvedValue(buffer)
    // act
    const fileImport = await importFile(
      accountName,
      {
        createdBy: "user",
        id: 0,
        metadata: {
          lastModified: 0,
          size: buffer.length,
          type: "text/csv",
        },
        name: fileName,
        scheduledAt: 0,
        status: "completed",
      },
      {
        userAddress: "0x003dC32fE920a4aAeeD12dC87E145F030aa753f3",
      }
    )
    const auditLogsCount = await countAuditLogs(
      accountName,
      `SELECT COUNT(*) FROM audit_logs WHERE fileImportId = ?`,
      [fileImport.id]
    )
    // assert
    delete fileImport.timestamp
    expect(fileImport).toMatchInlineSnapshot(`
      {
        "id": "4118854677",
        "lastModified": 0,
        "meta": {
          "assetIds": [
            "chain.ethereum:0x519475b31653E46D20cD09F9FdcF3B12BDAcB4f5:VIU",
            "chain.ethereum:0x52903256dd18D85c2Dc4a6C999907c9793eA61E3:INSP",
            "chain.ethereum:0x0AbdAce70D3790235af448C88547603b945604ea:DNT",
            "chain.ethereum:0x0F5D2fB29fb7d3CFeE444a200298f468908cC942:MANA",
            "chain.ethereum:0x42d6622deCe394b54999Fbd73D108123806f6a18:SPANK",
            "chain.ethereum:0x960b236A07cf122663c4303350609A66A7B288C0:ANT",
            "chain.ethereum:0xa74476443119A942dE498590Fe1f2454d7D4aC0d:GNT",
            "chain.ethereum:0xB9e7F8568e08d5659f5D29C4997173d84CdF2607:SWT",
            "chain.ethereum:0xE4E5E5e15dd6BcEBe489e5fABB4E8Bf8E01684DE:INT",
            "chain.ethereum:0x6B01c3170ae1EFEBEe1a3159172CB3F7A5ECf9E5:BOOTY",
            "chain.ethereum:0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359:SAI",
            "chain.ethereum:0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2:WETH",
            "chain.ethereum:0xd8D605151f55cd04827c3673C31eD3761fe7B6E9:MESH",
            "chain.ethereum:0x2fF2B86C156583b1135C584fd940A1996FA4230b:findtherabbit.me",
            "chain.ethereum:0x1ae5af661E9D8694038136751959070590db5EE4:SAFE",
            "chain.ethereum:0xF5DCe57282A584D2746FaF1593d3121Fcac444dC:cSAI",
            "chain.ethereum:0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5:cETH",
            "chain.ethereum:0x6B175474E89094C44Da98b954EedeAC495271d0F:DAI",
            "chain.ethereum:0xC12D1c73eE7DC3615BA4e37E4ABFdbDDFA38907E:KICK",
            "chain.ethereum:0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643:cDAI",
            "chain.ethereum:0x88938e9358D763C7655E788D92c731EcC9153cC5:DMS",
            "chain.ethereum:0xaAAf91D9b90dF800Df4F55c205fd6989c977E73a:TKN",
            "chain.ethereum:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48:USDC",
            "chain.ethereum:0xcD62b1C403fa761BAadFC74C525ce2B51780b184:ANJ",
            "chain.ethereum:0x2F141Ce366a2462f02cEA3D12CF93E4DCa49e4Fd:FREE",
            "chain.ethereum:0x0f8b6440A1F7BE3354fe072638a5C0F500b044bE:KTH",
            "chain.ethereum:0x136faE4333EA36A24bb751E2d505D6ca4Fd9f00b:ETHRSIAPY",
            "chain.ethereum:0xbf70A33A13fBe8D0106Df321Da0Cf654d2E9Ab50:ETHBTCRSI7030",
            "chain.ethereum:0xfC1E690f61EFd961294b3e1Ce3313fBD8aa4f85d:aDAI",
            "chain.ethereum:0x9bA00D6856a4eDF4665BcA2C2309936572473B7E:aUSDC",
            "chain.ethereum:0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8:yDAI+yUSDC+yUSDT+yTUSD",
            "chain.ethereum:0x1985365e9f78359a9B6AD760e32412f4a445E862:REP",
            "chain.ethereum:0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2:MKR",
            "chain.ethereum:0xBBbbCA6A901c926F240b89EacB641d8Aec7AEafD:LRC",
            "chain.ethereum:0x543Ff227F64Aa17eA132Bf9886cAb5DB55DCAddf:GEN",
            "chain.ethereum:0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984:UNI",
            "chain.ethereum:0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e:YFI",
            "chain.ethereum:0xBA2E7Fed597fd0E3e70f5130BcDbbFE06bB94fe1:yYFI",
            "chain.ethereum:0xC2aDdA861F89bBB333c90c492cB837741916A225:UNI-V2",
            "chain.ethereum:0x2fDbAdf3C4D5A8666Bc06645B8358ab803996E28:UNI-V2",
            "chain.ethereum:0xd3d2E2692501A5c9Ca623199D38826e513033a17:UNI-V2",
            "chain.ethereum:0xD533a949740bb3306d119CC777fa900bA034cd52:CRV",
            "chain.ethereum:0x35A18000230DA775CAc24873d00Ff85BccdeD550:cUNI",
            "chain.ethereum:0x7deB5e830be29F91E298ba5FF1356BB7f8146998:aMKR",
            "chain.ethereum:0xc00e94Cb662C3520282E6f5717214004A7f26888:COMP",
            "chain.ethereum:0xaeE2b2097ED86354AbfD4e2361761794C6DDc07b:oETH $500 Call 11/20/20",
            "chain.ethereum:0xc5bDdf9843308380375a611c18B50Fb9341f502A:yveCRV-DAO",
            "chain.ethereum:0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599:WBTC",
            "chain.ethereum:0xC11b1268C1A384e55C48c2391d8d480264A3A7F4:cWBTC",
            "chain.ethereum:0x429881672B9AE42b8EbA0E26cD9C73711b891Ca5:PICKLE",
            "chain.ethereum:0x5D8d9F5b96f4438195BE9b99eee6118Ed4304286:COVER",
            "chain.ethereum:0x088ee5007C98a9677165D78dD2109AE4a3D04d0C:SLP",
            "chain.ethereum:0x4Cf89ca06ad997bC732Dc876ed2A7F26a9E7f361:MYST",
            "chain.ethereum:0x71fbC1d795FcfBcA43A3ebF6de0101952f31a410:ADAO",
            "chain.ethereum:0x3472A5A71965499acd81997a54BBA8D852C6E53d:BADGER",
            "chain.ethereum:0xcD7989894bc033581532D2cd88Da5db0A4b12859:UNI-V2",
            "chain.ethereum:0x235c9e24D3FB2FAFd58a2E49D454Fdcd2DBf7FF1:bUNI-V2",
            "chain.ethereum:0xdAC17F958D2ee523a2206206994597C13D831ec7:USDT",
            "chain.ethereum:0x111111111117dC0aa78b770fA6A738034120C302:1INCH",
            "chain.ethereum:0x6B3595068778DD592e39A122f4f5a5cF09C90fE2:SUSHI",
            "chain.ethereum:0x798D1bE841a82a273720CE31c822C61a67a601C3:DIGG",
            "chain.ethereum:0xE86204c4eDDd2f70eE00EAd6805f917671F56c52:UNI-V2",
            "chain.ethereum:0xC17078FDd324CC473F8175Dc5290fae5f2E84714:bUNI-V2",
            "chain.ethereum:0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490:3Crv",
            "chain.ethereum:0x4688a8b1F292FDaB17E9a90c8Bc379dC1DBd8713:COVER",
            "chain.ethereum:0xDe30da39c46104798bB5aA3fe8B9e0e1F348163F:GTC",
            "chain.ethereum:0x7DD9c5Cba05E151C895FDe1CF355C9A1D5DA6429:GLM",
            "chain.ethereum:0xdb25cA703181E7484a155DD612b06f57E12Be5F0:yvYFI",
          ],
          "extensionId": "etherscan-file-import",
          "logs": 419,
          "operations": [
            "Deposit",
            "Withdraw",
          ],
          "parserId": "etherscan-erc20",
          "platformId": "chain.ethereum",
          "rows": 428,
          "transactions": 419,
          "wallets": [
            "0x003dC32fE920a4aAeeD12dC87E145F030aa753f3",
          ],
        },
        "name": "0x003dc/etherscan-erc20.csv",
        "size": 127936,
      }
    `)
    expect(auditLogsCount).toMatchInlineSnapshot(`419`)
  })

  it.sequential("should compute balances", async () => {
    // arrange
    const until = Date.UTC(2000, 0, 0, 0, 0, 0, 0) // 1 Jan 2000
    const updates: ProgressUpdate[] = []
    // act
    await computeBalances(accountName, { until }, async (state) => updates.push(state))
    // assert
    expect(updates.join("\n")).toMatchInlineSnapshot(`
      "0,Computing balances for 1025 audit logs
      0,Processing logs 1 to 1000
      87,Processed 1350 daily balances
      87,Processing logs 1001 to 1025
      90,Processed 622 daily balances
      96,Filling balances to reach today
      99,Setting balances cursor to Feb 28, 2023
      100,Saved 1973 records to disk"
    `)
  })

  it.sequential("should merge transactions", async () => {
    // arrange
    const updates: ProgressUpdate[] = []
    // act
    await autoMergeTransactions(accountName, async (state) => updates.push(state))
    // assert
    expect(updates.join("\n")).toMatchInlineSnapshot(`
      "0,Fetching all transactions
      25,Processing 949 (EVM) transactions
      50,Saving 211 merged transactions
      70,Updating the audit logs of 211 merged transactions
      90,Deleting 493 deduplicated transactions
      100,Done"
    `)
  })

  it.sequential("should compute trades from imported data", async () => {
    mocks.readFile.mockImplementation(fs.promises.readFile)
    // act
    const updates: ProgressUpdate[] = []
    await computeTrades(accountName, async (state) => updates.push(state))
    // assert
    expect(updates.join("\n")).toMatchInlineSnapshot(`
      "0,Fetching audit logs
      2.5,Processing 1025 audit logs
      6,Found 33 asset groups (skipped 36 unlisted assets)
      6,Processed all trades for ETH
      7,Processed all trades for DNT
      7,Processed all trades for MANA
      8,Processed all trades for SAI
      8,Processed all trades for WETH
      9,Processed all trades for CETH
      10,Processed all trades for DAI
      10,Processed all trades for CDAI
      11,Processed all trades for TKN
      11,Processed all trades for USDC
      12,Processed all trades for FREE
      12,Processed all trades for ADAI
      13,Processed all trades for AUSDC
      14,Processed all trades for MKR
      14,Processed all trades for LRC
      15,Processed all trades for UNI
      15,Processed all trades for YFI
      16,Processed all trades for CRV
      16,Processed all trades for CUNI
      17,Processed all trades for AMKR
      18,Processed all trades for COMP
      18,Processed all trades for WBTC
      19,Processed all trades for PICKLE
      19,Processed all trades for MYST
      20,Processed all trades for BADGER
      20,Processed all trades for USDT
      21,Processed all trades for 1INCH
      22,Processed all trades for SUSHI
      22,Processed all trades for DIGG
      23,Processed all trades for 3CRV
      23,Processed all trades for GTC
      24,Processed all trades for GLM
      25,Processed all trades for YVYFI
      25,Setting trades cursor to Sep 20, 2022
      25,Computed 86 trades
      30,Computing PnL for 86 trades
      30,Processed trade #1 (Long 47.67419555637689 ETH)
      31,Processed trade #2 (Long 1910 DNT)
      32,Processed trade #3 (Long 3067.671 MANA)
      33,Processed trade #4 (Long 10.87060820937004 SAI)
      33,Processed trade #5 (Long 1927.5 SAI)
      34,Processed trade #6 (Long 9462.77 SAI)
      35,Processed trade #7 (Long 8 WETH)
      36,Processed trade #8 (Long 47 WETH)
      36,Processed trade #9 (Long 2911 SAI)
      37,Processed trade #10 (Long 47.60993124529113 WETH)
      38,Processed trade #11 (Long 2250 SAI)
      39,Processed trade #12 (Long 1300 SAI)
      39,Processed trade #13 (Long 5144.247788224923 SAI)
      40,Processed trade #14 (Long 2325 SAI)
      41,Processed trade #15 (Long 1750 SAI)
      42,Processed trade #16 (Long 675.84 SAI)
      42,Processed trade #17 (Long 3075 SAI)
      43,Processed trade #18 (Long 3760 SAI)
      44,Processed trade #19 (Long 2098.99161694 CETH)
      45,Processed trade #20 (Long 1000 SAI)
      45,Processed trade #21 (Long 1000 SAI)
      46,Processed trade #22 (Long 1000 SAI)
      47,Processed trade #23 (Long 2750 SAI)
      48,Processed trade #24 (Long 2520.9911048659155 DAI)
      48,Processed trade #25 (Long 41035.42403614 CDAI)
      49,Processed trade #26 (Long 995 SAI)
      50,Processed trade #27 (Long 994.96892911 SAI)
      51,Processed trade #28 (Long 994.96892911 DAI)
      51,Processed trade #29 (Long 821.373092771901 DAI)
      52,Processed trade #30 (Long 2000 DAI)
      53,Processed trade #31 (Long 2839.5 DAI)
      54,Processed trade #32 (Long 2145.86543802 TKN)
      54,Processed trade #33 (Long 1571.469243 USDC)
      55,Processed trade #34 (Long 10000 FREE)
      56,Processed trade #35 (Long 99.957818 USDC)
      57,Processed trade #36 (Long 4430.2018948769455 ADAI)
      57,Processed trade #37 (Long 4607.000118 AUSDC)
      58,Processed trade #38 (Long 2497.72853867 CETH)
      59,Processed trade #39 (Long 3906 DAI)
      60,Processed trade #40 (Long 2146 DAI)
      60,Processed trade #41 (Long 4436.296511716325 DAI)
      61,Processed trade #42 (Short 6.094616839379424 ADAI)
      62,Processed trade #43 (Long 4506.611832 USDC)
      63,Processed trade #44 (Long 5794.773921 USDC)
      64,Processed trade #45 (Short 13.968052 AUSDC)
      64,Processed trade #46 (Long 5794.815104 USDC)
      65,Processed trade #47 (Long 7.076083294896952 MKR)
      66,Processed trade #48 (Long 5940.0227188854915 LRC)
      67,Processed trade #49 (Long 1017.881923452677 DAI)
      67,Processed trade #50 (Long 400 UNI)
      68,Processed trade #51 (Long 0.0970886 YFI)
      69,Processed trade #52 (Long 0.046449260886212644 YFI)
      70,Processed trade #53 (Long 2500 USDC)
      70,Processed trade #54 (Long 500 CRV)
      71,Processed trade #55 (Long 267.54314482231206 UNI)
      72,Processed trade #56 (Long 2.150945835565699 MKR)
      73,Processed trade #57 (Long 13322.70172601 CUNI)
      73,Processed trade #58 (Long 2.150945835565699 AMKR)
      74,Processed trade #59 (Long 6022.107825046159 DAI)
      75,Processed trade #60 (Long 1.2853117351540768 COMP)
      76,Processed trade #61 (Short 166.73610739646176 CRV)
      76,Processed trade #62 (Long 0.33333333 WBTC)
      77,Processed trade #63 (Long 2511.22 USDC)
      78,Processed trade #64 (Long 17 PICKLE)
      79,Processed trade #65 (Long 0.0508494402157599 YFI)
      79,Processed trade #66 (Long 521.4366690830452 MYST)
      80,Processed trade #67 (Long 42.85272155641802 BADGER)
      81,Processed trade #68 (Long 0.25532646 WBTC)
      82,Processed trade #69 (Long 1000 USDT)
      82,Processed trade #70 (Long 746.7450104902583 1INCH)
      83,Processed trade #71 (Long 21.374913152096518 SUSHI)
      84,Processed trade #72 (Long 0.07052041880285556 YFI)
      85,Processed trade #73 (Long 0.048925828 DIGG)
      85,Processed trade #74 (Long 56.68907623690096 BADGER)
      86,Processed trade #75 (Long 201.8817290386431 CRV)
      87,Processed trade #76 (Long 136.0013233557136 3CRV)
      88,Processed trade #77 (Long 2.15543784295425 MKR)
      88,Processed trade #78 (Short 0.004492007388551107 AMKR)
      89,Processed trade #79 (Long 269.05019322329014 UNI)
      90,Processed trade #80 (Long 0.0635 WBTC)
      91,Processed trade #81 (Long 0.09370821 WBTC)
      91,Processed trade #82 (Long 231.9853 GTC)
      92,Processed trade #83 (Long 248.18304423451846 CRV)
      93,Processed trade #84 (Long 17 PICKLE)
      94,Processed trade #85 (Long 441 GLM)
      95,Processed trade #86 (Long 0.001196905052533791 YVYFI)
      95,Saving 86 records to disk
      100,PnL computation completed"
    `)
  })

  it.sequential("should save the correct data", async () => {
    // act
    const auditLogs = await getAuditLogs(accountName)
    const transactions = await getTransactions(accountName)
    const balances = await getBalances(accountName)
    const trades = await getTrades(accountName, await getTradesFullQuery())
    // assert
    expect(transactions.length).toMatchInlineSnapshot(`667`)
    await expect(transactions.map(normalizeTransaction)).toMatchFileSnapshot(
      "../__snapshots__/0x003dc/transactions.ts.snap"
    )
    expect(auditLogs.length).toMatchInlineSnapshot(`1025`)
    await expect(auditLogs.map(sanitizeAuditLog)).toMatchFileSnapshot(
      "../__snapshots__/0x003dc/audit-logs.ts.snap"
    )
    expect(balances.length).toMatchInlineSnapshot(`1972`)
    for (let i = 0; i < balances.length; i += 100) {
      await expect(balances.slice(i, i + 100)).toMatchFileSnapshot(
        `../__snapshots__/0x003dc/balances-${i}.ts.snap`
      )
    }
    expect(trades.length).toMatchInlineSnapshot(`86`)
    for (let i = 0; i < trades.length; i += 5) {
      await expect(trades.slice(i, i + 5)).toMatchFileSnapshot(
        `../__snapshots__/0x003dc/trades-${i}.ts.snap`
      )
    }
  })

  it.sequential("should delete the file imports", async () => {
    // arrange
    const fileImports = await getFileImports(accountName)
    const updates: ProgressUpdate[] = []
    // act
    for (const fileImport of fileImports) {
      await deleteFileImport(accountName, fileImport, async (state) => updates.push(state))
    }
    // assert
    const remainingAuditLogs = await countAuditLogs(accountName)
    const remainingTransactions = await countTransactions(accountName)
    const remainingFileImports = await countFileImports(accountName)
    //
    expect(updates.join("\n")).toMatchInlineSnapshot(`
      "0,Removing file import with id 4118854677
      0,Removing 419 audit logs
      50,Removing 364 transactions
      100,Removed file import with id 4118854677
      0,Removing file import with id 2523657605
      0,Removing 61 audit logs
      50,Removing 32 transactions
      100,Removed file import with id 2523657605
      0,Removing file import with id 2137860255
      0,Removing 545 audit logs
      50,Removing 271 transactions
      100,Removed file import with id 2137860255"
    `)
    expect(remainingAuditLogs).toMatchInlineSnapshot(`0`)
    expect(remainingTransactions).toMatchInlineSnapshot(`0`)
    expect(remainingFileImports).toMatchInlineSnapshot(`0`)
  })
})
