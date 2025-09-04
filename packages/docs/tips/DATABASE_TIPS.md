# SQL int/bigint range

[link](https://learn.microsoft.com/en-us/sql/t-sql/data-types/int-bigint-smallint-and-tinyint-transact-sql?view=sql-server-ver16)  

| Data Type | Range                                                   | Range expression      | Storage (bytes) |
| --------- | ------------------------------------------------------- | --------------------- | --------------- |
| tinyint   | 0 to 255                                                | 2^0-1 to 2^8-1        | 1               |
| smallint  | -32.768 to 32.767                                       | -2^15 to 2^15-1       | 2               |
| mediumint | -8.388.608 to 8.388.607                                 | -2^23 to 2^23-1       | 3               |
| int       | -2.147.483.648 to 2.147.483.647                         | -2^31 to 2^31-1       | 4               |
| bigint    | -9.223.372.036.854.775.808 to 9.223.372.036.854.775.807 | -2^63 to 2^63-1       | 8               |
