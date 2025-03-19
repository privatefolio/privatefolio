# Adding a new platform

    # Adding a new platform - connection
        1. Go to setting.ts
        2. Add the new platform to PLATFORMS_META as follows:
            - (Ethereum Virtual Machine) [Chain ID]: { coingeckoId:[coingeckoId], logoUrl: [platform logo URL], name: [platform name], nativeAssetId:"eip155-[chain ID]:0x0000000000000000000000000000000000000000:[native_Asset]" }
            - (Others) [platformID]: { logoUrl: [platform_logo_URL], name: [platform_name] } 
        3. Add the platform ID to PLATFORM_IDS
        4. Add the platform ID to CONNECTIONS
        5. If there is no suitable parser for the new platform, create one, add it to PARSERS_META and add it's id to PARSER_IDS.
   
    #Adding a new platform - file import .csv
        1. Go to src/setting.ts
        2. Add the new platform to PLATFORMS_META 
        3. Add the platform ID to PLATFORM_IDS
        4. In the folder api/account/file-imports/integrations create a new file. Write the parser for the new platform
        5. Go to api/account/file-imports/integrations/index.ts
        6. Add the new header to HEADER_MATCHER as follows: [platform_name.HEADER]: platform_name.Identifier,
        7. Add the new parser to PARSER_MATCHER as follows: [platform_name.Identifier]: platform_name.parser,
        8. Add the new identifier to PLATFORM_MATCHER as follows: [platform_name.Identifier]: platform_name.platform.

# How it works

    # Connection
        When the Connection Drawer is open, the platform can be chosen. The select component displays the names of all the platforms in PLATFORM_META, defined in settings.ts. Ethereum Virtual Machines (EVM) require just the address, the label is optional; but for the connection with binance additional data is required, such as: the API key, the secret and the wallets. 
        When the Add button is pressed, it is checked whether the fields are filled in properly. After that, a connection is added with all the entered data. If the connection has been successfully added, the syncConnection task is added to the queue.
        For EVM and Ethereum is called syncEtherscan, and for binance syncBinance.
        In syncEtherscan are extracted normal, internal and ERC20 transactions, using the address and the chainId to differentiate the platforms. Then parsers are used to form the txns and logs objects.
        In syncBinance, for each wallet, the related endpoints are used in order to extract data about the user's activities. Then parsers are used to form the transactions and audit logs objects.

    # File Import

        When a file is uploaded the task addFileImport is added to the queue. With the help of parseCsv function, transactions, audit logs and data information are extracted from the file. 
        The file header must match one header defined in the HEADER_MATCHER from index.ts. After the header is identified, the parser and platform corresponding to the header are determined. The data si processed and transactions and audit logs are returned.

## Testing

    - Create a new file with the extension test.ts in test/connections
    - Set an account name and reset the account
    - Add the connection
    - Sync the connection
    - Compute the balances
    - Merge the transactions
    - Save the data and compare it with the one already saved
    - Run the test: yarn test test/connections/file_name.test.ts
      - The first time the test is run "-u" must be added to the end of the command