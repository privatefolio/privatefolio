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
import { describe, expect, it, vi } from "vitest"

const accountName = Math.random().toString(36).substring(7)

const mocks = vi.hoisted(() => {
  return {
    access: vi.fn().mockResolvedValue(true),
    readFile: vi.fn(),
  }
})

vi.mock("fs/promises", () => ({
  ...fs.promises,
  access: mocks.access,
  readFile: mocks.readFile,
}))

describe("should import 0x003dc via files", () => {
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
            "ethereum:0x0000000000000000000000000000000000000000:ETH",
          ],
          "extensionId": "etherscan-file-import",
          "logs": 545,
          "operations": [
            "Deposit",
            "Fee",
            "Withdraw",
          ],
          "parserId": "etherscan-default",
          "platform": "ethereum",
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
            "ethereum:0x0000000000000000000000000000000000000000:ETH",
            "ethereum:0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2:WETH",
          ],
          "extensionId": "etherscan-file-import",
          "logs": 61,
          "operations": [
            "Deposit",
            "Withdraw",
          ],
          "parserId": "etherscan-internal",
          "platform": "ethereum",
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
            "ethereum:0x519475b31653E46D20cD09F9FdcF3B12BDAcB4f5:VIU",
            "ethereum:0x52903256dd18D85c2Dc4a6C999907c9793eA61E3:INSP",
            "ethereum:0x0AbdAce70D3790235af448C88547603b945604ea:DNT",
            "ethereum:0x0F5D2fB29fb7d3CFeE444a200298f468908cC942:MANA",
            "ethereum:0x42d6622deCe394b54999Fbd73D108123806f6a18:SPANK",
            "ethereum:0x960b236A07cf122663c4303350609A66A7B288C0:ANT",
            "ethereum:0xa74476443119A942dE498590Fe1f2454d7D4aC0d:GNT",
            "ethereum:0xB9e7F8568e08d5659f5D29C4997173d84CdF2607:SWT",
            "ethereum:0xE4E5E5e15dd6BcEBe489e5fABB4E8Bf8E01684DE:INT",
            "ethereum:0x6B01c3170ae1EFEBEe1a3159172CB3F7A5ECf9E5:BOOTY",
            "ethereum:0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359:SAI",
            "ethereum:0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2:WETH",
            "ethereum:0xd8D605151f55cd04827c3673C31eD3761fe7B6E9:MESH",
            "ethereum:0x2fF2B86C156583b1135C584fd940A1996FA4230b:findtherabbit.me",
            "ethereum:0x1ae5af661E9D8694038136751959070590db5EE4:SAFE",
            "ethereum:0xF5DCe57282A584D2746FaF1593d3121Fcac444dC:cSAI",
            "ethereum:0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5:cETH",
            "ethereum:0x6B175474E89094C44Da98b954EedeAC495271d0F:DAI",
            "ethereum:0xC12D1c73eE7DC3615BA4e37E4ABFdbDDFA38907E:KICK",
            "ethereum:0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643:cDAI",
            "ethereum:0x88938e9358D763C7655E788D92c731EcC9153cC5:DMS",
            "ethereum:0xaAAf91D9b90dF800Df4F55c205fd6989c977E73a:TKN",
            "ethereum:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48:USDC",
            "ethereum:0xcD62b1C403fa761BAadFC74C525ce2B51780b184:ANJ",
            "ethereum:0x2F141Ce366a2462f02cEA3D12CF93E4DCa49e4Fd:FREE",
            "ethereum:0x0f8b6440A1F7BE3354fe072638a5C0F500b044bE:KTH",
            "ethereum:0x136faE4333EA36A24bb751E2d505D6ca4Fd9f00b:ETHRSIAPY",
            "ethereum:0xbf70A33A13fBe8D0106Df321Da0Cf654d2E9Ab50:ETHBTCRSI7030",
            "ethereum:0xfC1E690f61EFd961294b3e1Ce3313fBD8aa4f85d:aDAI",
            "ethereum:0x9bA00D6856a4eDF4665BcA2C2309936572473B7E:aUSDC",
            "ethereum:0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8:yDAI+yUSDC+yUSDT+yTUSD",
            "ethereum:0x1985365e9f78359a9B6AD760e32412f4a445E862:REP",
            "ethereum:0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2:MKR",
            "ethereum:0xBBbbCA6A901c926F240b89EacB641d8Aec7AEafD:LRC",
            "ethereum:0x543Ff227F64Aa17eA132Bf9886cAb5DB55DCAddf:GEN",
            "ethereum:0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984:UNI",
            "ethereum:0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e:YFI",
            "ethereum:0xBA2E7Fed597fd0E3e70f5130BcDbbFE06bB94fe1:yYFI",
            "ethereum:0xC2aDdA861F89bBB333c90c492cB837741916A225:UNI-V2",
            "ethereum:0x2fDbAdf3C4D5A8666Bc06645B8358ab803996E28:UNI-V2",
            "ethereum:0xd3d2E2692501A5c9Ca623199D38826e513033a17:UNI-V2",
            "ethereum:0xD533a949740bb3306d119CC777fa900bA034cd52:CRV",
            "ethereum:0x35A18000230DA775CAc24873d00Ff85BccdeD550:cUNI",
            "ethereum:0x7deB5e830be29F91E298ba5FF1356BB7f8146998:aMKR",
            "ethereum:0xc00e94Cb662C3520282E6f5717214004A7f26888:COMP",
            "ethereum:0xaeE2b2097ED86354AbfD4e2361761794C6DDc07b:oETH $500 Call 11/20/20",
            "ethereum:0xc5bDdf9843308380375a611c18B50Fb9341f502A:yveCRV-DAO",
            "ethereum:0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599:WBTC",
            "ethereum:0xC11b1268C1A384e55C48c2391d8d480264A3A7F4:cWBTC",
            "ethereum:0x429881672B9AE42b8EbA0E26cD9C73711b891Ca5:PICKLE",
            "ethereum:0x5D8d9F5b96f4438195BE9b99eee6118Ed4304286:COVER",
            "ethereum:0x088ee5007C98a9677165D78dD2109AE4a3D04d0C:SLP",
            "ethereum:0x4Cf89ca06ad997bC732Dc876ed2A7F26a9E7f361:MYST",
            "ethereum:0x71fbC1d795FcfBcA43A3ebF6de0101952f31a410:ADAO",
            "ethereum:0x3472A5A71965499acd81997a54BBA8D852C6E53d:BADGER",
            "ethereum:0xcD7989894bc033581532D2cd88Da5db0A4b12859:UNI-V2",
            "ethereum:0x235c9e24D3FB2FAFd58a2E49D454Fdcd2DBf7FF1:bUNI-V2",
            "ethereum:0xdAC17F958D2ee523a2206206994597C13D831ec7:USDT",
            "ethereum:0x111111111117dC0aa78b770fA6A738034120C302:1INCH",
            "ethereum:0x6B3595068778DD592e39A122f4f5a5cF09C90fE2:SUSHI",
            "ethereum:0x798D1bE841a82a273720CE31c822C61a67a601C3:DIGG",
            "ethereum:0xE86204c4eDDd2f70eE00EAd6805f917671F56c52:UNI-V2",
            "ethereum:0xC17078FDd324CC473F8175Dc5290fae5f2E84714:bUNI-V2",
            "ethereum:0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490:3Crv",
            "ethereum:0x4688a8b1F292FDaB17E9a90c8Bc379dC1DBd8713:COVER",
            "ethereum:0xDe30da39c46104798bB5aA3fe8B9e0e1F348163F:GTC",
            "ethereum:0x7DD9c5Cba05E151C895FDe1CF355C9A1D5DA6429:GLM",
            "ethereum:0xdb25cA703181E7484a155DD612b06f57E12Be5F0:yvYFI",
          ],
          "extensionId": "etherscan-file-import",
          "logs": 419,
          "operations": [
            "Deposit",
            "Withdraw",
          ],
          "parserId": "etherscan-erc20",
          "platform": "ethereum",
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
      95,Setting networth cursor to Dec 31, 1969
      96,Filling balances to reach today
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
    // act
    const updates: ProgressUpdate[] = []
    await computeTrades(accountName, async (state) => updates.push(state))
    // assert
    expect(updates.join("\n")).toMatchInlineSnapshot(`
      "0,Fetching audit logs
      10,Processing 1025 audit logs
      20,Found 69 asset groups
      21,Processed 1/69 asset groups
      22,Processed 2/69 asset groups
      23,Processed 3/69 asset groups
      24,Processed 4/69 asset groups
      25,Processed 5/69 asset groups
      26,Processed 6/69 asset groups
      27,Processed 7/69 asset groups
      28,Processed 8/69 asset groups
      29,Processed 9/69 asset groups
      30,Processed 10/69 asset groups
      31,Processed 11/69 asset groups
      32,Processed 12/69 asset groups
      33,Processed 13/69 asset groups
      34,Processed 14/69 asset groups
      35,Processed 15/69 asset groups
      36,Processed 16/69 asset groups
      37,Processed 17/69 asset groups
      38,Processed 18/69 asset groups
      39,Processed 19/69 asset groups
      40,Processed 20/69 asset groups
      41,Processed 21/69 asset groups
      42,Processed 22/69 asset groups
      43,Processed 23/69 asset groups
      44,Processed 24/69 asset groups
      45,Processed 25/69 asset groups
      46,Processed 26/69 asset groups
      47,Processed 27/69 asset groups
      48,Processed 28/69 asset groups
      49,Processed 29/69 asset groups
      50,Processed 30/69 asset groups
      51,Processed 31/69 asset groups
      52,Processed 32/69 asset groups
      53,Processed 33/69 asset groups
      54,Processed 34/69 asset groups
      55,Processed 35/69 asset groups
      56,Processed 36/69 asset groups
      57,Processed 37/69 asset groups
      58,Processed 38/69 asset groups
      59,Processed 39/69 asset groups
      60,Processed 40/69 asset groups
      61,Processed 41/69 asset groups
      62,Processed 42/69 asset groups
      63,Processed 43/69 asset groups
      64,Processed 44/69 asset groups
      65,Processed 45/69 asset groups
      66,Processed 46/69 asset groups
      67,Processed 47/69 asset groups
      68,Processed 48/69 asset groups
      69,Processed 49/69 asset groups
      70,Processed 50/69 asset groups
      71,Processed 51/69 asset groups
      72,Processed 52/69 asset groups
      73,Processed 53/69 asset groups
      74,Processed 54/69 asset groups
      75,Processed 55/69 asset groups
      76,Processed 56/69 asset groups
      77,Processed 57/69 asset groups
      78,Processed 58/69 asset groups
      79,Processed 59/69 asset groups
      80,Processed 60/69 asset groups
      81,Processed 61/69 asset groups
      82,Processed 62/69 asset groups
      83,Processed 63/69 asset groups
      84,Processed 64/69 asset groups
      85,Processed 65/69 asset groups
      86,Processed 66/69 asset groups
      87,Processed 67/69 asset groups
      88,Processed 68/69 asset groups
      90,Processed 69/69 asset groups
      100,Trades computation completed"
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
    expect(trades.length).toMatchInlineSnapshot(`129`)
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
      25,Setting balances cursor to Nov 20, 2017
      25,Setting networth cursor to Nov 20, 2017
      50,Removing 364 transactions
      100,Removed file import with id 4118854677
      0,Removing file import with id 2523657605
      0,Removing 61 audit logs
      25,Setting balances cursor to Sep 25, 2018
      25,Setting networth cursor to Sep 25, 2018
      50,Removing 32 transactions
      100,Removed file import with id 2523657605
      0,Removing file import with id 2137860255
      0,Removing 545 audit logs
      25,Setting balances cursor to Oct 06, 2017
      25,Setting networth cursor to Oct 06, 2017
      50,Removing 271 transactions
      100,Removed file import with id 2137860255"
    `)
    expect(remainingAuditLogs).toMatchInlineSnapshot(`0`)
    expect(remainingTransactions).toMatchInlineSnapshot(`0`)
    expect(remainingFileImports).toMatchInlineSnapshot(`0`)
  })
})
