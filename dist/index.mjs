var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/common/constants.ts
var SOL_TOKEN = {
  chainId: 101,
  address: "So11111111111111111111111111111111111111112",
  name: "SOL",
  decimals: 9,
  symbol: "SOL",
  logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  extensions: {
    coingeckoId: "solana"
  }
};

// src/common/index.ts
var common_exports = {};
__export(common_exports, {
  createAssociatedTokenAccountInstruction: () => createAssociatedTokenAccountInstruction,
  createFakeWallet: () => createFakeWallet,
  findAssociatedTokenAddress: () => findAssociatedTokenAddress,
  getSuggestedLoans: () => getSuggestedLoans,
  getTokenBalance: () => getTokenBalance
});
import { web3, utils } from "@project-serum/anchor";

// src/common/classes/nodewallet.ts
var NodeWallet = class {
  constructor(payer) {
    this.payer = payer;
  }
  async signTransaction(tx) {
    tx.partialSign(this.payer);
    return tx;
  }
  async signAllTransactions(txs) {
    return txs.map((tx) => {
      tx.partialSign(this.payer);
      return tx;
    });
  }
  get publicKey() {
    return this.payer.publicKey;
  }
};

// src/common/index.ts
var createFakeWallet = () => {
  const leakedKp = web3.Keypair.fromSecretKey(
    Uint8Array.from([
      208,
      175,
      150,
      242,
      88,
      34,
      108,
      88,
      177,
      16,
      168,
      75,
      115,
      181,
      199,
      242,
      120,
      4,
      78,
      75,
      19,
      227,
      13,
      215,
      184,
      108,
      226,
      53,
      111,
      149,
      179,
      84,
      137,
      121,
      79,
      1,
      160,
      223,
      124,
      241,
      202,
      203,
      220,
      237,
      50,
      242,
      57,
      158,
      226,
      207,
      203,
      188,
      43,
      28,
      70,
      110,
      214,
      234,
      251,
      15,
      249,
      157,
      62,
      80
    ])
  );
  return new NodeWallet(leakedKp);
};
var findAssociatedTokenAddress = async (walletAddress, tokenMintAddress) => (await web3.PublicKey.findProgramAddress(
  [walletAddress.toBuffer(), utils.token.TOKEN_PROGRAM_ID.toBuffer(), tokenMintAddress.toBuffer()],
  utils.token.ASSOCIATED_PROGRAM_ID
))[0];
var getTokenBalance = async (pubkey, connection) => {
  const balance = await connection.getTokenAccountBalance(pubkey);
  return parseInt(balance.value.amount);
};
var createAssociatedTokenAccountInstruction = (associatedTokenAddress, payer, walletAddress, splTokenMintAddress) => {
  const keys = [
    {
      pubkey: payer,
      isSigner: true,
      isWritable: true
    },
    {
      pubkey: associatedTokenAddress,
      isSigner: false,
      isWritable: true
    },
    {
      pubkey: walletAddress,
      isSigner: false,
      isWritable: false
    },
    {
      pubkey: splTokenMintAddress,
      isSigner: false,
      isWritable: false
    },
    {
      pubkey: web3.SystemProgram.programId,
      isSigner: false,
      isWritable: false
    },
    {
      pubkey: utils.token.TOKEN_PROGRAM_ID,
      isSigner: false,
      isWritable: false
    },
    {
      pubkey: web3.SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false
    }
  ];
  return [
    new web3.TransactionInstruction({
      keys,
      programId: utils.token.ASSOCIATED_PROGRAM_ID,
      data: Buffer.from([])
    })
  ];
};
var getSuggestedLoans = (items, minValue) => {
  let sum = 0;
  let i = 0;
  const best = [];
  const cheapest = [];
  const safest = [];
  const sortedElementsByValue = items.sort((a, b) => {
    if (a.maxLoanValue !== b.maxLoanValue) {
      return a.maxLoanValue - b.maxLoanValue;
    }
    return a.interest - b.interest;
  });
  const sortedElementsByInterest = items.sort((a, b) => {
    if (a.interest !== b.interest) {
      return a.interest - b.interest;
    } else if (a.maxLoanValue !== b.maxLoanValue) {
      return a.maxLoanValue - b.maxLoanValue;
    }
    return a.amountOfDays - b.amountOfDays;
  });
  const priceBased = sortedElementsByInterest.filter((element) => element.maxLoanValue !== element.minLoanValue);
  const timeBased = sortedElementsByInterest.filter((element) => element.maxLoanValue === element.minLoanValue);
  const concated = priceBased.concat(timeBased);
  while (sum < minValue && i < sortedElementsByValue.length) {
    best.push({
      nftMint: sortedElementsByValue[i].nftMint,
      loanValue: sortedElementsByValue[i].maxLoanValue,
      interest: sortedElementsByValue[i].interest,
      amountOfDays: sortedElementsByValue[i].amountOfDays
    });
    sum += sortedElementsByValue[i].maxLoanValue;
    i += 1;
  }
  if (sum < minValue) {
    return {
      best,
      safest: best,
      cheapest: best
    };
  }
  sum = 0;
  i = 0;
  while (sum < minValue && i < concated.length) {
    cheapest.push({
      nftMint: concated[i].nftMint,
      loanValue: concated[i].maxLoanValue,
      interest: concated[i].interest,
      amountOfDays: concated[i].amountOfDays
    });
    sum += concated[i].maxLoanValue;
    i += 1;
  }
  sum = 0;
  i = 0;
  while (sum < minValue && i < concated.length) {
    safest.push({
      nftMint: concated[i].nftMint,
      loanValue: concated[i].minLoanValue,
      interest: concated[i].interest,
      amountOfDays: concated[i].amountOfDays
    });
    sum += concated[i].minLoanValue;
    i += 1;
  }
  i = 0;
  while (sum < minValue) {
    sum += concated[i].maxLoanValue - safest[i].loanValue;
    safest[i].loanValue = concated[i].maxLoanValue;
    i += 1;
  }
  return {
    best,
    safest,
    cheapest
  };
};

// src/loans/index.ts
var loans_exports = {};
__export(loans_exports, {
  anchorRawBNsAndPubkeysToNumsAndStrings: () => anchorRawBNsAndPubkeysToNumsAndStrings,
  approveLoanByAdmin: () => approveLoanByAdmin,
  calculateRewardDegod: () => calculateRewardDegod,
  claimGemFarm: () => claimGemFarm,
  claimGemFarmIx: () => claimGemFarmIx,
  closeLoanByAdmin: () => closeLoanByAdmin,
  decodeLoan: () => decodeLoan,
  decodeLotTicket: () => decodeLotTicket,
  decodedCollectionInfo: () => decodedCollectionInfo,
  decodedDeposit: () => decodedDeposit,
  decodedFarmer: () => decodedFarmer,
  decodedLendingStake: () => decodedLendingStake,
  decodedLoan: () => decodedLoan,
  decodedPriceBasedLiquidityPool: () => decodedPriceBasedLiquidityPool,
  decodedTimeBasedLiquidityPool: () => decodedTimeBasedLiquidityPool,
  depositLiquidity: () => depositLiquidity,
  getAllFarmAccounts: () => getAllFarmAccounts,
  getAllProgramAccounts: () => getAllProgramAccounts,
  getFarmAccount: () => getFarmAccount,
  getLotTicket: () => getLotTicket,
  getLotTicketByStaking: () => getLotTicketByStaking,
  getMetaplexEditionPda: () => getMetaplexEditionPda,
  getMostOptimalLoansClosestToNeededSolInBulk: () => getMostOptimalLoansClosestToNeededSolInBulk,
  harvestLiquidity: () => harvestLiquidity,
  initializeCollectionInfo: () => initializeCollectionInfo,
  initializeNftAttemptsByStaking: () => initializeNftAttemptsByStaking,
  initializePriceBasedLiquidityPool: () => initializePriceBasedLiquidityPool,
  initializeTimeBasedLiquidityPool: () => initializeTimeBasedLiquidityPool,
  liquidateLoanByAdmin: () => liquidateLoanByAdmin,
  liquidateLoanToRaffles: () => liquidateLoanToRaffles,
  objectBNsAndPubkeysToNums: () => objectBNsAndPubkeysToNums,
  paybackLoan: () => paybackLoan,
  paybackLoanIx: () => paybackLoanIx,
  paybackLoanWithGrace: () => paybackLoanWithGrace,
  paybackLoanWithGraceIx: () => paybackLoanWithGraceIx,
  proposeLoan: () => proposeLoan,
  proposeLoanIx: () => proposeLoanIx,
  putLoanToLiquidationRaffles: () => putLoanToLiquidationRaffles,
  redeemWinningLotTicket: () => redeemWinningLotTicket,
  rejectLoanByAdmin: () => rejectLoanByAdmin,
  returnAnchorProgram: () => returnAnchorProgram,
  revealLotTicketByAdmin: () => revealLotTicketByAdmin,
  stakeGemFarm: () => stakeGemFarm,
  stopLiquidationRaffles: () => stopLiquidationRaffles,
  unstakeGemFarm: () => unstakeGemFarm,
  unstakeGemFarmByAdmin: () => unstakeGemFarmByAdmin,
  unstakeGemFarmIx: () => unstakeGemFarmIx,
  unstakeLiquidity: () => unstakeLiquidity,
  updateCollectionInfo: () => updateCollectionInfo,
  updatePriceBasedLiquidityPool: () => updatePriceBasedLiquidityPool,
  updateTimeBasedLiquidityPool: () => updateTimeBasedLiquidityPool
});

// src/loans/functions/private/approveLoanByAdmin.ts
import { web3 as web34, BN as BN2 } from "@project-serum/anchor";

// src/loans/helpers.ts
import { Program, AnchorProvider, web3 as web33, BN, utils as utils2 } from "@project-serum/anchor";

// src/loans/idl/nft_lending_v2.json
var nft_lending_v2_default = {
  version: "0.1.0",
  name: "nft_lending_v2",
  instructions: [
    {
      name: "proposeLoan",
      accounts: [
        {
          name: "loan",
          isMut: true,
          isSigner: true
        },
        {
          name: "user",
          isMut: true,
          isSigner: true
        },
        {
          name: "nftUserTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "nftMint",
          isMut: true,
          isSigner: false
        },
        {
          name: "communityPoolsAuthority",
          isMut: true,
          isSigner: false
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "metadataProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "editionInfo",
          isMut: false,
          isSigner: false
        },
        {
          name: "admin",
          isMut: true,
          isSigner: false,
          docs: [
            "CHECK"
          ]
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "bumpPoolsAuth",
          type: "u8"
        },
        {
          name: "isPriceBased",
          type: "bool"
        },
        {
          name: "originalPriceFromUser",
          type: "u64"
        },
        {
          name: "loanToValue",
          type: "u64"
        }
      ]
    },
    {
      name: "approveLoanByAdmin",
      accounts: [
        {
          name: "loan",
          isMut: true,
          isSigner: false
        },
        {
          name: "user",
          isMut: true,
          isSigner: false
        },
        {
          name: "liquidityPool",
          isMut: true,
          isSigner: false
        },
        {
          name: "liqOwner",
          isMut: true,
          isSigner: false
        },
        {
          name: "collectionInfo",
          isMut: false,
          isSigner: false
        },
        {
          name: "admin",
          isMut: true,
          isSigner: true
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "nftPrice",
          type: "u64"
        },
        {
          name: "discount",
          type: "u64"
        }
      ]
    },
    {
      name: "depositLiquidity",
      accounts: [
        {
          name: "liquidityPool",
          isMut: true,
          isSigner: false
        },
        {
          name: "liqOwner",
          isMut: true,
          isSigner: false
        },
        {
          name: "deposit",
          isMut: true,
          isSigner: false
        },
        {
          name: "user",
          isMut: true,
          isSigner: true
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "amount",
          type: "u64"
        }
      ]
    },
    {
      name: "initializeCollectionInfo",
      accounts: [
        {
          name: "collectionInfo",
          isMut: true,
          isSigner: true
        },
        {
          name: "admin",
          isMut: true,
          isSigner: true
        },
        {
          name: "creatorAddress",
          isMut: false,
          isSigner: false
        },
        {
          name: "liquidityPool",
          isMut: false,
          isSigner: false
        },
        {
          name: "pricingLookupAddress",
          isMut: false,
          isSigner: false
        },
        {
          name: "royaltyAddress",
          isMut: false,
          isSigner: false
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "params",
          type: {
            defined: "CollectionInfoParams"
          }
        }
      ]
    },
    {
      name: "updateCollectionInfo",
      accounts: [
        {
          name: "collectionInfo",
          isMut: true,
          isSigner: false
        },
        {
          name: "admin",
          isMut: true,
          isSigner: true
        },
        {
          name: "creatorAddress",
          isMut: false,
          isSigner: false
        },
        {
          name: "liquidityPool",
          isMut: true,
          isSigner: false
        },
        {
          name: "pricingLookupAddress",
          isMut: false,
          isSigner: false
        },
        {
          name: "royaltyAddress",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "params",
          type: {
            defined: "CollectionInfoParams"
          }
        }
      ]
    },
    {
      name: "initializePriceBasedLiquidityPool",
      accounts: [
        {
          name: "liquidityPool",
          isMut: true,
          isSigner: true
        },
        {
          name: "liqOwner",
          isMut: true,
          isSigner: false
        },
        {
          name: "admin",
          isMut: true,
          isSigner: true
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "bumpPoolsAuth",
          type: "u8"
        },
        {
          name: "params",
          type: {
            defined: "PriceBasedLiqPoolInputParams"
          }
        }
      ]
    },
    {
      name: "updatePriceBasedLiquidityPool",
      accounts: [
        {
          name: "liquidityPool",
          isMut: true,
          isSigner: false
        },
        {
          name: "admin",
          isMut: true,
          isSigner: true
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "params",
          type: {
            defined: "PriceBasedLiqPoolInputParams"
          }
        }
      ]
    },
    {
      name: "paybackLoan",
      accounts: [
        {
          name: "loan",
          isMut: true,
          isSigner: false
        },
        {
          name: "liquidityPool",
          isMut: true,
          isSigner: false
        },
        {
          name: "collectionInfo",
          isMut: false,
          isSigner: false
        },
        {
          name: "admin",
          isMut: true,
          isSigner: false,
          docs: [
            "CHECK"
          ]
        },
        {
          name: "user",
          isMut: true,
          isSigner: true
        },
        {
          name: "nftMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "nftUserTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "royaltyAddress",
          isMut: true,
          isSigner: false
        },
        {
          name: "liqOwner",
          isMut: true,
          isSigner: false
        },
        {
          name: "communityPoolsAuthority",
          isMut: true,
          isSigner: false
        },
        {
          name: "metadataProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "editionInfo",
          isMut: false,
          isSigner: false
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "bumpPoolsAuth",
          type: "u8"
        },
        {
          name: "amount",
          type: "u64"
        }
      ]
    },
    {
      name: "rejectLoanByAdmin",
      accounts: [
        {
          name: "loan",
          isMut: true,
          isSigner: false
        },
        {
          name: "admin",
          isMut: true,
          isSigner: true
        },
        {
          name: "nftMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "nftUserTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "user",
          isMut: true,
          isSigner: false
        },
        {
          name: "communityPoolsAuthority",
          isMut: true,
          isSigner: false
        },
        {
          name: "metadataProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "editionInfo",
          isMut: false,
          isSigner: false
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "bumpPoolsAuth",
          type: "u8"
        }
      ]
    },
    {
      name: "unstakeLiquidity",
      accounts: [
        {
          name: "liquidityPool",
          isMut: true,
          isSigner: false
        },
        {
          name: "deposit",
          isMut: true,
          isSigner: false
        },
        {
          name: "user",
          isMut: true,
          isSigner: true
        },
        {
          name: "liqOwner",
          isMut: true,
          isSigner: false
        },
        {
          name: "admin",
          isMut: true,
          isSigner: false,
          docs: [
            "CHECK"
          ]
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "depositBump",
          type: "u8"
        },
        {
          name: "amount",
          type: "u64"
        }
      ]
    },
    {
      name: "harvestLiquidity",
      accounts: [
        {
          name: "liquidityPool",
          isMut: true,
          isSigner: false
        },
        {
          name: "liqOwner",
          isMut: true,
          isSigner: false
        },
        {
          name: "deposit",
          isMut: true,
          isSigner: false
        },
        {
          name: "user",
          isMut: true,
          isSigner: true
        },
        {
          name: "admin",
          isMut: true,
          isSigner: false,
          docs: [
            "CHECK"
          ]
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "depositBump",
          type: "u8"
        }
      ]
    },
    {
      name: "liquidateNftToRaffles",
      accounts: [
        {
          name: "loan",
          isMut: true,
          isSigner: false
        },
        {
          name: "liquidationLot",
          isMut: true,
          isSigner: true
        },
        {
          name: "user",
          isMut: true,
          isSigner: false
        },
        {
          name: "liquidator",
          isMut: true,
          isSigner: true
        },
        {
          name: "nftMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "vaultNftTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "nftUserTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "communityPoolsAuthority",
          isMut: true,
          isSigner: false
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "metadataProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "editionInfo",
          isMut: false,
          isSigner: false
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "bumpPoolsAuth",
          type: "u8"
        },
        {
          name: "gracePeriod",
          type: "u64"
        }
      ]
    },
    {
      name: "paybackWithGrace",
      accounts: [
        {
          name: "loan",
          isMut: true,
          isSigner: false
        },
        {
          name: "liquidationLot",
          isMut: true,
          isSigner: false
        },
        {
          name: "liquidityPool",
          isMut: true,
          isSigner: false
        },
        {
          name: "collectionInfo",
          isMut: false,
          isSigner: false
        },
        {
          name: "admin",
          isMut: true,
          isSigner: false,
          docs: [
            "CHECK"
          ]
        },
        {
          name: "user",
          isMut: true,
          isSigner: true
        },
        {
          name: "nftMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "vaultNftTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "nftUserTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "royaltyAddress",
          isMut: true,
          isSigner: false
        },
        {
          name: "liqOwner",
          isMut: true,
          isSigner: false
        },
        {
          name: "communityPoolsAuthority",
          isMut: true,
          isSigner: false
        },
        {
          name: "metadataProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "editionInfo",
          isMut: false,
          isSigner: false
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "bumpPoolsAuth",
          type: "u8"
        }
      ]
    },
    {
      name: "getLotTicket",
      accounts: [
        {
          name: "liquidationLot",
          isMut: true,
          isSigner: false
        },
        {
          name: "nftAttempts",
          isMut: true,
          isSigner: false
        },
        {
          name: "lotTicket",
          isMut: true,
          isSigner: true
        },
        {
          name: "user",
          isMut: true,
          isSigner: true
        },
        {
          name: "attemptsNftMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "nftUserTokenAccount",
          isMut: true,
          isSigner: false
        }
      ],
      args: [
        {
          name: "nftAttemptsBump",
          type: "u8"
        }
      ]
    },
    {
      name: "initializeNftAttempts",
      accounts: [
        {
          name: "nftAttempts",
          isMut: true,
          isSigner: false
        },
        {
          name: "user",
          isMut: true,
          isSigner: true
        },
        {
          name: "nftMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: []
    },
    {
      name: "redeemWinningLotTicket",
      accounts: [
        {
          name: "lotTicket",
          isMut: true,
          isSigner: false
        },
        {
          name: "loan",
          isMut: true,
          isSigner: false
        },
        {
          name: "liquidationLot",
          isMut: true,
          isSigner: false
        },
        {
          name: "liquidityPool",
          isMut: true,
          isSigner: false
        },
        {
          name: "collectionInfo",
          isMut: false,
          isSigner: false
        },
        {
          name: "admin",
          isMut: true,
          isSigner: false,
          docs: [
            "CHECK"
          ]
        },
        {
          name: "user",
          isMut: true,
          isSigner: true
        },
        {
          name: "nftMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "vaultNftTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "nftUserTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "royaltyAddress",
          isMut: true,
          isSigner: false
        },
        {
          name: "liqOwner",
          isMut: true,
          isSigner: false
        },
        {
          name: "communityPoolsAuthority",
          isMut: true,
          isSigner: false
        },
        {
          name: "metadataProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "editionInfo",
          isMut: false,
          isSigner: false
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "bumpPoolsAuth",
          type: "u8"
        }
      ]
    },
    {
      name: "rejectLotTicketByAdmin",
      accounts: [
        {
          name: "lotTicket",
          isMut: true,
          isSigner: false
        },
        {
          name: "admin",
          isMut: true,
          isSigner: true
        }
      ],
      args: []
    },
    {
      name: "revealLotTicketByAdmin",
      accounts: [
        {
          name: "lotTicket",
          isMut: true,
          isSigner: false
        },
        {
          name: "admin",
          isMut: true,
          isSigner: true
        }
      ],
      args: [
        {
          name: "isWinning",
          type: "bool"
        }
      ]
    },
    {
      name: "withdrawFromReserveFund",
      accounts: [
        {
          name: "liquidityPool",
          isMut: true,
          isSigner: false
        },
        {
          name: "liqOwner",
          isMut: true,
          isSigner: false
        },
        {
          name: "admin",
          isMut: true,
          isSigner: true
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: []
    },
    {
      name: "stopLiquidationRafflesByAdmin",
      accounts: [
        {
          name: "loan",
          isMut: true,
          isSigner: false
        },
        {
          name: "liquidationLot",
          isMut: true,
          isSigner: false
        },
        {
          name: "admin",
          isMut: true,
          isSigner: true,
          docs: [
            "CHECK"
          ]
        },
        {
          name: "nftMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "vaultNftTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "nftAdminTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "communityPoolsAuthority",
          isMut: true,
          isSigner: false
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "bumpPoolsAuth",
          type: "u8"
        }
      ]
    },
    {
      name: "putLoanToLiquidationRaffles",
      accounts: [
        {
          name: "loan",
          isMut: true,
          isSigner: false
        },
        {
          name: "liquidationLot",
          isMut: true,
          isSigner: true
        },
        {
          name: "admin",
          isMut: true,
          isSigner: true
        },
        {
          name: "nftMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "vaultNftTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "nftAdminTokenAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "communityPoolsAuthority",
          isMut: true,
          isSigner: false
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "bumpPoolsAuth",
          type: "u8"
        },
        {
          name: "gracePeriod",
          type: "u64"
        }
      ]
    },
    {
      name: "initializeNftAttemptsByStaking",
      accounts: [
        {
          name: "nftAttempts",
          isMut: true,
          isSigner: false
        },
        {
          name: "user",
          isMut: true,
          isSigner: true
        },
        {
          name: "nftMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "fraktNftStakeAccount",
          isMut: false,
          isSigner: false
        }
      ],
      args: []
    },
    {
      name: "getLotTicketByStaking",
      accounts: [
        {
          name: "liquidationLot",
          isMut: true,
          isSigner: false
        },
        {
          name: "nftAttempts",
          isMut: true,
          isSigner: false
        },
        {
          name: "lotTicket",
          isMut: true,
          isSigner: true
        },
        {
          name: "user",
          isMut: true,
          isSigner: true
        },
        {
          name: "attemptsNftMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "fraktNftStakeAccount",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "nftAttemptsBump",
          type: "u8"
        }
      ]
    },
    {
      name: "stakeGemFarmStaking",
      accounts: [
        {
          name: "user",
          isMut: true,
          isSigner: true
        },
        {
          name: "lendingStake",
          isMut: true,
          isSigner: false
        },
        {
          name: "gemFarm",
          isMut: false,
          isSigner: false
        },
        {
          name: "farm",
          isMut: true,
          isSigner: false
        },
        {
          name: "farmAuthority",
          isMut: true,
          isSigner: false
        },
        {
          name: "farmer",
          isMut: true,
          isSigner: false
        },
        {
          name: "loan",
          isMut: true,
          isSigner: false
        },
        {
          name: "identity",
          isMut: true,
          isSigner: false
        },
        {
          name: "bank",
          isMut: true,
          isSigner: false
        },
        {
          name: "gemBank",
          isMut: false,
          isSigner: false
        },
        {
          name: "feeAcc",
          isMut: true,
          isSigner: false
        },
        {
          name: "vault",
          isMut: true,
          isSigner: false
        },
        {
          name: "authority",
          isMut: false,
          isSigner: false
        },
        {
          name: "gemBox",
          isMut: true,
          isSigner: false
        },
        {
          name: "gemDepositReceipt",
          isMut: true,
          isSigner: false
        },
        {
          name: "gemSource",
          isMut: true,
          isSigner: false
        },
        {
          name: "gemMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "gemRarity",
          isMut: false,
          isSigner: false
        },
        {
          name: "communityPoolsAuthority",
          isMut: true,
          isSigner: false
        },
        {
          name: "editionInfo",
          isMut: false,
          isSigner: false
        },
        {
          name: "metadataProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "params",
          type: {
            defined: "StakeGemFarmParams"
          }
        }
      ]
    },
    {
      name: "unstakeGemFarmStaking",
      accounts: [
        {
          name: "user",
          isMut: true,
          isSigner: true
        },
        {
          name: "gemFarm",
          isMut: false,
          isSigner: false
        },
        {
          name: "lendingStake",
          isMut: true,
          isSigner: false
        },
        {
          name: "farm",
          isMut: true,
          isSigner: false
        },
        {
          name: "farmAuthority",
          isMut: true,
          isSigner: false
        },
        {
          name: "farmer",
          isMut: true,
          isSigner: false
        },
        {
          name: "farmTreasury",
          isMut: true,
          isSigner: false
        },
        {
          name: "loan",
          isMut: true,
          isSigner: false
        },
        {
          name: "identity",
          isMut: true,
          isSigner: false
        },
        {
          name: "bank",
          isMut: true,
          isSigner: false
        },
        {
          name: "gemBank",
          isMut: false,
          isSigner: false
        },
        {
          name: "feeAcc",
          isMut: true,
          isSigner: false
        },
        {
          name: "vault",
          isMut: true,
          isSigner: false
        },
        {
          name: "authority",
          isMut: false,
          isSigner: false
        },
        {
          name: "gemBox",
          isMut: true,
          isSigner: false
        },
        {
          name: "gemDepositReceipt",
          isMut: true,
          isSigner: false
        },
        {
          name: "gemSource",
          isMut: true,
          isSigner: false
        },
        {
          name: "gemMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "gemRarity",
          isMut: false,
          isSigner: false
        },
        {
          name: "communityPoolsAuthority",
          isMut: true,
          isSigner: false
        },
        {
          name: "editionInfo",
          isMut: false,
          isSigner: false
        },
        {
          name: "metadataProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "params",
          type: {
            defined: "UnstakeGemFarmParams"
          }
        }
      ]
    },
    {
      name: "claimGemFarmStaking",
      accounts: [
        {
          name: "user",
          isMut: true,
          isSigner: true
        },
        {
          name: "gemFarm",
          isMut: false,
          isSigner: false
        },
        {
          name: "farm",
          isMut: true,
          isSigner: false
        },
        {
          name: "farmAuthority",
          isMut: true,
          isSigner: false
        },
        {
          name: "farmer",
          isMut: true,
          isSigner: false
        },
        {
          name: "loan",
          isMut: true,
          isSigner: false
        },
        {
          name: "gemMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "identity",
          isMut: true,
          isSigner: false
        },
        {
          name: "rewardAPot",
          isMut: true,
          isSigner: false
        },
        {
          name: "rewardAMint",
          isMut: true,
          isSigner: false
        },
        {
          name: "rewardADestinationIdentity",
          isMut: true,
          isSigner: false
        },
        {
          name: "rewardBPot",
          isMut: true,
          isSigner: false
        },
        {
          name: "rewardBMint",
          isMut: true,
          isSigner: false
        },
        {
          name: "rewardBDestinationIdentity",
          isMut: true,
          isSigner: false
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "params",
          type: {
            defined: "ClaimGemFarmParams"
          }
        }
      ]
    },
    {
      name: "getClaimedGemFarmStaking",
      accounts: [
        {
          name: "user",
          isMut: true,
          isSigner: true
        },
        {
          name: "identity",
          isMut: true,
          isSigner: false
        },
        {
          name: "lendingStake",
          isMut: true,
          isSigner: false
        },
        {
          name: "loan",
          isMut: true,
          isSigner: false
        },
        {
          name: "gemMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "rewardAMint",
          isMut: true,
          isSigner: false
        },
        {
          name: "rewardADestinationIdentity",
          isMut: true,
          isSigner: false
        },
        {
          name: "rewardADestination",
          isMut: true,
          isSigner: false
        },
        {
          name: "rewardBMint",
          isMut: true,
          isSigner: false
        },
        {
          name: "rewardBDestinationIdentity",
          isMut: true,
          isSigner: false
        },
        {
          name: "rewardBDestination",
          isMut: true,
          isSigner: false
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "bumpAuth",
          type: "u8"
        }
      ]
    },
    {
      name: "unstakeGemFarmStakingByAdmin",
      accounts: [
        {
          name: "admin",
          isMut: true,
          isSigner: true
        },
        {
          name: "gemFarm",
          isMut: false,
          isSigner: false
        },
        {
          name: "lendingStake",
          isMut: true,
          isSigner: false
        },
        {
          name: "farm",
          isMut: true,
          isSigner: false
        },
        {
          name: "farmAuthority",
          isMut: true,
          isSigner: false
        },
        {
          name: "farmer",
          isMut: true,
          isSigner: false
        },
        {
          name: "farmTreasury",
          isMut: true,
          isSigner: false
        },
        {
          name: "loan",
          isMut: true,
          isSigner: false
        },
        {
          name: "identity",
          isMut: true,
          isSigner: false
        },
        {
          name: "bank",
          isMut: true,
          isSigner: false
        },
        {
          name: "gemBank",
          isMut: false,
          isSigner: false
        },
        {
          name: "feeAcc",
          isMut: true,
          isSigner: false
        },
        {
          name: "vault",
          isMut: true,
          isSigner: false
        },
        {
          name: "authority",
          isMut: false,
          isSigner: false
        },
        {
          name: "gemBox",
          isMut: true,
          isSigner: false
        },
        {
          name: "gemDepositReceipt",
          isMut: true,
          isSigner: false
        },
        {
          name: "gemSource",
          isMut: true,
          isSigner: false
        },
        {
          name: "gemMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "gemRarity",
          isMut: false,
          isSigner: false
        },
        {
          name: "communityPoolsAuthority",
          isMut: true,
          isSigner: false
        },
        {
          name: "editionInfo",
          isMut: false,
          isSigner: false
        },
        {
          name: "metadataProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "params",
          type: {
            defined: "UnstakeGemFarmParams"
          }
        }
      ]
    }
  ],
  accounts: [
    {
      name: "CollectionInfo",
      type: {
        kind: "struct",
        fields: [
          {
            name: "creator",
            type: "publicKey"
          },
          {
            name: "liquidityPool",
            type: "publicKey"
          },
          {
            name: "pricingLookupAddress",
            type: "publicKey"
          },
          {
            name: "royaltyAddress",
            type: "publicKey"
          },
          {
            name: "royaltyFeeTime",
            type: "u64"
          },
          {
            name: "royaltyFeePrice",
            type: "u64"
          },
          {
            name: "loanToValue",
            type: "u64"
          },
          {
            name: "collaterizationRate",
            type: "u64"
          },
          {
            name: "availableLoanTypes",
            type: {
              defined: "AvailableLoanTypes"
            }
          },
          {
            name: "expirationTime",
            type: "u64"
          }
        ]
      }
    },
    {
      name: "Deposit",
      type: {
        kind: "struct",
        fields: [
          {
            name: "liquidityPool",
            type: "publicKey"
          },
          {
            name: "user",
            type: "publicKey"
          },
          {
            name: "amount",
            type: "u64"
          },
          {
            name: "stakedAt",
            type: "u64"
          },
          {
            name: "stakedAtCumulative",
            type: "u64"
          }
        ]
      }
    },
    {
      name: "LendingStake",
      type: {
        kind: "struct",
        fields: [
          {
            name: "stakeType",
            type: {
              defined: "StakeType"
            }
          },
          {
            name: "loan",
            type: "publicKey"
          },
          {
            name: "stakeContract",
            type: "publicKey"
          },
          {
            name: "stakeContractOptional",
            type: "publicKey"
          },
          {
            name: "stakeState",
            type: {
              defined: "StakeState"
            }
          },
          {
            name: "identity",
            type: "publicKey"
          },
          {
            name: "dataA",
            type: "publicKey"
          },
          {
            name: "dataB",
            type: "publicKey"
          },
          {
            name: "dataC",
            type: "publicKey"
          },
          {
            name: "dataD",
            type: "publicKey"
          },
          {
            name: "totalHarvested",
            type: "u64"
          },
          {
            name: "totalHarvestedOptional",
            type: "u64"
          },
          {
            name: "lastTime",
            type: "u64"
          }
        ]
      }
    },
    {
      name: "LiquidationLot",
      type: {
        kind: "struct",
        fields: [
          {
            name: "loan",
            type: "publicKey"
          },
          {
            name: "nftMint",
            type: "publicKey"
          },
          {
            name: "vaultNftTokenAccount",
            type: "publicKey"
          },
          {
            name: "lotNoFeesPrice",
            type: "u64"
          },
          {
            name: "winningChanceInBasePoints",
            type: "u64"
          },
          {
            name: "startedAt",
            type: "u64"
          },
          {
            name: "endingAt",
            type: "u64"
          },
          {
            name: "lotState",
            type: {
              defined: "LotState"
            }
          },
          {
            name: "ticketsCount",
            type: "u64"
          },
          {
            name: "gracePeriod",
            type: "u64"
          },
          {
            name: "graceFee",
            type: "u64"
          }
        ]
      }
    },
    {
      name: "Loan",
      type: {
        kind: "struct",
        fields: [
          {
            name: "user",
            type: "publicKey"
          },
          {
            name: "nftMint",
            type: "publicKey"
          },
          {
            name: "nftUserTokenAccount",
            type: "publicKey"
          },
          {
            name: "liquidityPool",
            type: "publicKey"
          },
          {
            name: "collectionInfo",
            type: "publicKey"
          },
          {
            name: "startedAt",
            type: "u64"
          },
          {
            name: "expiredAt",
            type: {
              option: "u64"
            }
          },
          {
            name: "finishedAt",
            type: "u64"
          },
          {
            name: "originalPrice",
            type: "u64"
          },
          {
            name: "amountToGet",
            type: "u64"
          },
          {
            name: "rewardAmount",
            type: "u64"
          },
          {
            name: "feeAmount",
            type: "u64"
          },
          {
            name: "royaltyAmount",
            type: "u64"
          },
          {
            name: "rewardInterestRate",
            type: {
              option: "u64"
            }
          },
          {
            name: "feeInterestRate",
            type: {
              option: "u64"
            }
          },
          {
            name: "royaltyInterestRate",
            type: {
              option: "u64"
            }
          },
          {
            name: "loanStatus",
            type: {
              defined: "LoanStatus"
            }
          },
          {
            name: "loanType",
            type: {
              defined: "LoanType"
            }
          }
        ]
      }
    },
    {
      name: "LotTicket",
      type: {
        kind: "struct",
        fields: [
          {
            name: "liquidationLot",
            type: "publicKey"
          },
          {
            name: "user",
            type: "publicKey"
          },
          {
            name: "usedNftAttempts",
            type: "publicKey"
          },
          {
            name: "ticketState",
            type: {
              defined: "TicketState"
            }
          }
        ]
      }
    },
    {
      name: "NftAttempts",
      type: {
        kind: "struct",
        fields: [
          {
            name: "nftMint",
            type: "publicKey"
          },
          {
            name: "blockedUntil",
            type: "u64"
          },
          {
            name: "attempts",
            type: "u64"
          },
          {
            name: "cycleStartedAt",
            type: "u64"
          },
          {
            name: "lastTriedAt",
            type: "u64"
          }
        ]
      }
    },
    {
      name: "PriceBasedLiquidityPool",
      type: {
        kind: "struct",
        fields: [
          {
            name: "id",
            type: "u64"
          },
          {
            name: "baseBorrowRate",
            type: "u32"
          },
          {
            name: "variableSlope1",
            type: "u32"
          },
          {
            name: "variableSlope2",
            type: "u32"
          },
          {
            name: "utilizationRateOptimal",
            type: "u32"
          },
          {
            name: "reserveFactor",
            type: "u32"
          },
          {
            name: "reserveAmount",
            type: "u64"
          },
          {
            name: "liquidityAmount",
            type: "u64"
          },
          {
            name: "liqOwner",
            type: "publicKey"
          },
          {
            name: "liqSeed",
            type: "u8"
          },
          {
            name: "amountOfStaked",
            type: "u64"
          },
          {
            name: "depositApr",
            type: "u64"
          },
          {
            name: "borrowApr",
            type: "u64"
          },
          {
            name: "borrowCumulative",
            type: "u64"
          },
          {
            name: "depositCumulative",
            type: "u64"
          },
          {
            name: "lastTime",
            type: "u64"
          },
          {
            name: "borrowCommission",
            type: "u32"
          },
          {
            name: "depositCommission",
            type: "u32"
          }
        ]
      }
    },
    {
      name: "LiquidityPool",
      type: {
        kind: "struct",
        fields: [
          {
            name: "id",
            type: "u64"
          },
          {
            name: "rewardInterestRateTime",
            type: "u64"
          },
          {
            name: "feeInterestRateTime",
            type: "u64"
          },
          {
            name: "rewardInterestRatePrice",
            type: "u64"
          },
          {
            name: "feeInterestRatePrice",
            type: "u64"
          },
          {
            name: "liquidityAmount",
            type: "u64"
          },
          {
            name: "liqOwner",
            type: "publicKey"
          },
          {
            name: "liqSeed",
            type: "u8"
          },
          {
            name: "amountOfStaked",
            type: "u64"
          },
          {
            name: "userRewardsAmount",
            type: "u64"
          },
          {
            name: "apr",
            type: "u64"
          },
          {
            name: "cumulative",
            type: "u64"
          },
          {
            name: "lastTime",
            type: "u64"
          },
          {
            name: "oldCumulative",
            type: "u64"
          },
          {
            name: "period",
            type: "u64"
          }
        ]
      }
    }
  ],
  types: [
    {
      name: "ClaimGemFarmParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "bumpAuth",
            type: "u8"
          },
          {
            name: "bumpAuthAuthority",
            type: "u8"
          },
          {
            name: "bumpFarmer",
            type: "u8"
          },
          {
            name: "bumpPotA",
            type: "u8"
          },
          {
            name: "bumpPotB",
            type: "u8"
          },
          {
            name: "isDegod",
            type: "bool"
          }
        ]
      }
    },
    {
      name: "CollectionInfoParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "loanToValue",
            type: "u64"
          },
          {
            name: "collaterizationRate",
            type: "u64"
          },
          {
            name: "royaltyFeeTime",
            type: "u64"
          },
          {
            name: "royaltyFeePrice",
            type: "u64"
          },
          {
            name: "expirationTime",
            type: "u64"
          },
          {
            name: "isPriceBased",
            type: "bool"
          }
        ]
      }
    },
    {
      name: "PriceBasedLiqPoolInputParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "id",
            type: "u32"
          },
          {
            name: "baseBorrowRate",
            type: "u32"
          },
          {
            name: "variableSlope1",
            type: "u32"
          },
          {
            name: "variableSlope2",
            type: "u32"
          },
          {
            name: "utilizationRateOptimal",
            type: "u32"
          },
          {
            name: "reserveFactor",
            type: "u32"
          },
          {
            name: "borrowCommission",
            type: "u32"
          },
          {
            name: "depositCommission",
            type: "u32"
          }
        ]
      }
    },
    {
      name: "StakeGemFarmParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "bumpPoolsAuth",
            type: "u8"
          },
          {
            name: "bumpAuth",
            type: "u8"
          },
          {
            name: "bumpFarmAuth",
            type: "u8"
          },
          {
            name: "bumpAuthVaultAuthority",
            type: "u8"
          },
          {
            name: "bumpRarity",
            type: "u8"
          },
          {
            name: "bumpFarmer",
            type: "u8"
          },
          {
            name: "bumpGdr",
            type: "u8"
          },
          {
            name: "bumpGemBox",
            type: "u8"
          },
          {
            name: "bumpVault",
            type: "u8"
          },
          {
            name: "isDegod",
            type: "bool"
          }
        ]
      }
    },
    {
      name: "UnstakeGemFarmParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "bumpPoolsAuth",
            type: "u8"
          },
          {
            name: "bumpAuth",
            type: "u8"
          },
          {
            name: "bumpAuthAuthority",
            type: "u8"
          },
          {
            name: "bumpTreasury",
            type: "u8"
          },
          {
            name: "bumpFarmer",
            type: "u8"
          },
          {
            name: "bumpAuthVaultAuthority",
            type: "u8"
          },
          {
            name: "bumpGemBox",
            type: "u8"
          },
          {
            name: "bumpGdr",
            type: "u8"
          },
          {
            name: "bumpRarity",
            type: "u8"
          },
          {
            name: "isDegod",
            type: "bool"
          }
        ]
      }
    },
    {
      name: "AvailableLoanTypes",
      type: {
        kind: "enum",
        variants: [
          {
            name: "OnlyTimeBased"
          },
          {
            name: "OnlyPriceBased"
          }
        ]
      }
    },
    {
      name: "StakeType",
      type: {
        kind: "enum",
        variants: [
          {
            name: "DeGods"
          },
          {
            name: "GemWorksNewest"
          },
          {
            name: "Cets"
          }
        ]
      }
    },
    {
      name: "StakeState",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Unstaked"
          },
          {
            name: "Staked"
          }
        ]
      }
    },
    {
      name: "LotState",
      type: {
        kind: "enum",
        variants: [
          {
            name: "NotActive"
          },
          {
            name: "Active"
          },
          {
            name: "Redeemed"
          },
          {
            name: "PaidBackWithGrace"
          }
        ]
      }
    },
    {
      name: "LoanStatus",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Proposed"
          },
          {
            name: "Rejected"
          },
          {
            name: "Activated"
          },
          {
            name: "PaidBack"
          },
          {
            name: "Liquidated"
          },
          {
            name: "PaidBackWithGrace"
          }
        ]
      }
    },
    {
      name: "LoanType",
      type: {
        kind: "enum",
        variants: [
          {
            name: "TimeBased"
          },
          {
            name: "PriceBased"
          }
        ]
      }
    },
    {
      name: "TicketState",
      type: {
        kind: "enum",
        variants: [
          {
            name: "ToBeRevealed"
          },
          {
            name: "NotWinning"
          },
          {
            name: "Winning"
          },
          {
            name: "Rejected"
          }
        ]
      }
    }
  ],
  events: [
    {
      name: "LoanUpdate",
      fields: [
        {
          name: "loan",
          type: "string",
          index: false
        },
        {
          name: "status",
          type: {
            defined: "LoanStatus"
          },
          index: false
        }
      ]
    }
  ],
  errors: [
    {
      code: 6e3,
      name: "InvalidInstruction",
      msg: "InvalidInstruction"
    },
    {
      code: 6001,
      name: "MoreThanHave",
      msg: "MoreThanHave"
    },
    {
      code: 6002,
      name: "LoanIsNotProposed",
      msg: "LoanIsNotProposed"
    },
    {
      code: 6003,
      name: "CollectionInfoDoNotConnectWithNftMint",
      msg: "CollectionInfoDoNotConnectWithNftMint"
    },
    {
      code: 6004,
      name: "IncorrectNftMint",
      msg: "IncorrectNftMint"
    },
    {
      code: 6005,
      name: "IncorrectTokenAccount",
      msg: "IncorrectTokenAccount"
    },
    {
      code: 6006,
      name: "LoanIsNotActivated",
      msg: "LoanIsNotActivated"
    },
    {
      code: 6007,
      name: "LoanIsNotLiquidated",
      msg: "LoanIsNotLiquidated"
    },
    {
      code: 6008,
      name: "TimeIsExpired",
      msg: "TimeIsExpired"
    },
    {
      code: 6009,
      name: "CollectionInfoDoesntMatchLiquidityPool",
      msg: "CollectionInfoDoesntMatchLiquidityPool"
    },
    {
      code: 6010,
      name: "CannotClose",
      msg: "CannotClose"
    },
    {
      code: 6011,
      name: "WrongTypeOfAvailableLoan",
      msg: "WrongTypeOfAvailableLoan"
    },
    {
      code: 6012,
      name: "InvalidLoan",
      msg: "InvalidLoan"
    },
    {
      code: 6013,
      name: "NftsAttemptsAreUsed",
      msg: "NftsAttemptsAreUsed"
    },
    {
      code: 6014,
      name: "GracePeriodNotEnded",
      msg: "GracePeriodNotEnded"
    },
    {
      code: 6015,
      name: "GracePerionIsAlreadyEnded",
      msg: "GracePerionIsAlreadyEnded"
    },
    {
      code: 6016,
      name: "LotIsAlreadyEnded",
      msg: "LotIsAlreadyEnded"
    },
    {
      code: 6017,
      name: "LotIsNotLiquidatedYet",
      msg: "LotIsNotLiquidatedYet"
    },
    {
      code: 6018,
      name: "TicketIsRevealedOrRejected",
      msg: "TicketIsRevealedOrRejected"
    },
    {
      code: 6019,
      name: "TicketIsNotWinning",
      msg: "TicketIsNotWinning"
    },
    {
      code: 6020,
      name: "WrongLiqPool",
      msg: "WrongLiqPool"
    },
    {
      code: 6021,
      name: "WrongLiqOwner",
      msg: "WrongLiqOwner"
    },
    {
      code: 6022,
      name: "WrongUserOnLoan",
      msg: "WrongUserOnLoan"
    },
    {
      code: 6023,
      name: "WrongAdmin",
      msg: "WrongAdmin"
    },
    {
      code: 6024,
      name: "WrongNftMintOnLoan",
      msg: "WrongNftMintOnLoan"
    },
    {
      code: 6025,
      name: "WrongLoanOnLiquidationLot",
      msg: "WrongLoanOnLiquidationLot"
    },
    {
      code: 6026,
      name: "WrongNftMintOnLiquidationLot",
      msg: "WrongNftMintOnLiquidationLot"
    },
    {
      code: 6027,
      name: "WrongNftMintOnNftAttempts",
      msg: "WrongNftMintOnNftAttempts"
    },
    {
      code: 6028,
      name: "WrongLiqPoolOnDeposit",
      msg: "WrongLiqPoolOnDeposit"
    },
    {
      code: 6029,
      name: "WrongUserOnDeposit",
      msg: "WrongUserOnDeposit"
    },
    {
      code: 6030,
      name: "WrongTokenAccountOnLoan",
      msg: "WrongTokenAccountOnLoan"
    },
    {
      code: 6031,
      name: "WrongLiquidator",
      msg: "WrongLiquidator"
    },
    {
      code: 6032,
      name: "WrongRoyaltyAddressOnCollectionInfo",
      msg: "WrongRoyaltyAddressOnCollectionInfo"
    },
    {
      code: 6033,
      name: "WrongLiqPoolOnCollectionInfo",
      msg: "WrongLiqPoolOnCollectionInfo"
    },
    {
      code: 6034,
      name: "WrongCollectionInfoOnLoan",
      msg: "WrongCollectionInfoOnLoan"
    },
    {
      code: 6035,
      name: "WrongLiqPoolOnLoan",
      msg: "WrongLiqPoolOnLoan"
    },
    {
      code: 6036,
      name: "WrongVaultAccountOnLiquidationLot",
      msg: "WrongVaultAccountOnLiquidationLot"
    },
    {
      code: 6037,
      name: "WrongLiqLotOnLotTicket",
      msg: "WrongLiqLotOnLotTicket"
    },
    {
      code: 6038,
      name: "WrongUserOnLotTicket",
      msg: "WrongUserOnLotTicket"
    },
    {
      code: 6039,
      name: "LotStateIsNotActive",
      msg: "LotStateIsNotActive"
    },
    {
      code: 6040,
      name: "WrongLoanToValue",
      msg: "WrongLoanToValue"
    },
    {
      code: 6041,
      name: "FunctionIsNotSupportedForNow",
      msg: "Function is not supported right now"
    },
    {
      code: 6042,
      name: "CantSetLtvMoreThanNftValue",
      msg: "Can't set loan to value more than 100%"
    },
    {
      code: 6043,
      name: "FraktNftStakeNotInitialized",
      msg: "FraktNftStakeNotInitialized"
    },
    {
      code: 6044,
      name: "FraktNftNotStaked",
      msg: "FraktNftNotStaked"
    },
    {
      code: 6045,
      name: "FraktNftStakeOwnerDoesntMatch",
      msg: "FraktNftStakeOwnerDoesntMatch"
    },
    {
      code: 6046,
      name: "TokenAccountDoesntContainNft",
      msg: "TokenAccountDoesntContainNft"
    },
    {
      code: 6047,
      name: "StakingAccountDoesntMatchAttemptsNftMint",
      msg: "StakingAccountDoesntMatchAttemptsNftMint"
    },
    {
      code: 6048,
      name: "UserDoesntOwnStake",
      msg: "UserDoesntOwnStake"
    }
  ]
};

// src/loans/constants.ts
import { web3 as web32 } from "@project-serum/anchor";
var METADATA_PROGRAM_PUBKEY = new web32.PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
var METADATA_PREFIX = "metadata";
var EDITION_PREFIX = "edition";

// src/loans/helpers.ts
var returnAnchorProgram = (programId, connection) => new Program(
  nft_lending_v2_default,
  programId,
  new AnchorProvider(connection, createFakeWallet(), AnchorProvider.defaultOptions())
);
var decodedCollectionInfo = (decodedCollection, address) => ({
  collectionInfoPubkey: address.toBase58(),
  creator: decodedCollection.creator.toBase58(),
  liquidityPool: decodedCollection.liquidityPool.toBase58(),
  pricingLookupAddress: decodedCollection.pricingLookupAddress.toBase58(),
  royaltyAddress: decodedCollection.royaltyAddress.toBase58(),
  royaltyFeeTime: decodedCollection.royaltyFeeTime.toNumber(),
  royaltyFeePrice: decodedCollection.royaltyFeePrice.toNumber(),
  loanToValue: decodedCollection.loanToValue.toNumber(),
  collaterizationRate: decodedCollection.collaterizationRate.toNumber(),
  availableLoanTypes: Object.keys(decodedCollection.availableLoanTypes)[0],
  expirationTime: decodedCollection.expirationTime.toNumber()
});
var decodedLendingStake = (decodedStake, address) => ({
  lendingStakePubkey: address.toBase58(),
  stakeType: Object.keys(decodedStake.stakeType)[0],
  loan: decodedStake.loan.toBase58(),
  stakeContract: decodedStake.stakeContract.toBase58(),
  stakeConstractOptional: decodedStake.stakeConstractOptional?.toBase58(),
  stakeState: Object.keys(decodedStake.stakeState)[0],
  identity: decodedStake.identity.toBase58(),
  dataA: decodedStake.dataA.toBase58(),
  dataB: decodedStake.dataB.toBase58(),
  dataC: decodedStake.dataC.toBase58(),
  dataD: decodedStake.dataD.toBase58(),
  totalHarvested: decodedStake.totalHarvested.toNumber(),
  totalHarvestedOptional: decodedStake.totalHarvestedOptional.toNumber(),
  lastTime: decodedStake.lastTime.toNumber()
});
var decodedFarmer = (decodedFarmer2, address) => ({
  farmerPubkey: address.toBase58(),
  farm: decodedFarmer2.farm.toBase58(),
  identity: decodedFarmer2.identity.toBase58(),
  vault: decodedFarmer2.vault.toBase58(),
  state: Object.keys(decodedFarmer2.state)[0],
  gemsStaked: decodedFarmer2.gemsStaked.toNumber(),
  minStakingEndsTs: decodedFarmer2.minStakingEndsTs.toNumber(),
  cooldownEndsTs: decodedFarmer2.cooldownEndsTs.toNumber(),
  rewardA: decodedReward(decodedFarmer2.rewardA),
  rewardB: decodedReward(decodedFarmer2.rewardB)
});
var decodedReward = (decodedReward2) => ({
  paidOutReward: decodedReward2.paidOutReward.toNumber(),
  accruedReward: decodedReward2.accruedReward.toNumber(),
  variableRate: decodedReward2.lastRecordedAccruedRewardPerRarityPoint?.n?.toNumber(),
  fixedRate: decodedFixedRate(decodedReward2.fixedRate)
});
var decodedFixedRate = (decodedFixedRate2) => ({
  beginScheduleTs: decodedFixedRate2.beginScheduleTs.toNumber(),
  beginStakingTs: decodedFixedRate2.beginStakingTs.toNumber(),
  lastUpdatedTs: decodedFixedRate2.lastUpdatedTs.toNumber(),
  promisedDuration: decodedFixedRate2.promisedDuration.toNumber(),
  promisedSchedule: decodedPromisedSchedule(decodedFixedRate2.promisedSchedule)
});
var decodedPromisedSchedule = (decodedSchedule) => ({
  baseRate: decodedSchedule.baseRate?.toNumber(),
  tier1: decodedSchedule.tier1?.toNumber(),
  tier2: decodedSchedule.tier2?.toNumber(),
  tier3: decodedSchedule.tier3?.toNumber(),
  denominator: decodedSchedule.denominator?.toNumber()
});
var decodedTimeBasedLiquidityPool = (decodedLiquidityPool, address) => ({
  liquidityPoolPubkey: address.toBase58(),
  id: decodedLiquidityPool.id.toNumber(),
  rewardInterestRateTime: decodedLiquidityPool.rewardInterestRateTime.toNumber(),
  feeInterestRateTime: decodedLiquidityPool.feeInterestRateTime.toNumber(),
  rewardInterestRatePrice: decodedLiquidityPool.rewardInterestRatePrice.toNumber(),
  feeInterestRatePrice: decodedLiquidityPool.feeInterestRatePrice.toNumber(),
  liquidityAmount: decodedLiquidityPool.liquidityAmount.toNumber(),
  liqOwner: decodedLiquidityPool.liqOwner.toBase58(),
  amountOfStaked: decodedLiquidityPool.amountOfStaked.toNumber(),
  userRewardsAmount: decodedLiquidityPool.userRewardsAmount.toNumber(),
  apr: decodedLiquidityPool.apr.toNumber(),
  cumulative: decodedLiquidityPool.cumulative.toNumber(),
  lastTime: decodedLiquidityPool.lastTime.toNumber(),
  oldCumulative: decodedLiquidityPool.oldCumulative.toNumber(),
  period: decodedLiquidityPool.period.toNumber()
});
var decodedPriceBasedLiquidityPool = (decodedLiquidityPool, address) => ({
  liquidityPoolPubkey: address.toBase58(),
  id: decodedLiquidityPool.id.toNumber(),
  baseBorrowRate: decodedLiquidityPool.baseBorrowRate,
  variableSlope1: decodedLiquidityPool.variableSlope1,
  variableSlope2: decodedLiquidityPool.variableSlope2,
  utilizationRateOptimal: decodedLiquidityPool.utilizationRateOptimal,
  reserveFactor: decodedLiquidityPool.reserveFactor,
  reserveAmount: decodedLiquidityPool.reserveAmount.toString(),
  liquidityAmount: decodedLiquidityPool.liquidityAmount.toNumber(),
  liqOwner: decodedLiquidityPool.liqOwner.toBase58(),
  amountOfStaked: decodedLiquidityPool.amountOfStaked.toNumber(),
  depositApr: decodedLiquidityPool.depositApr.toNumber(),
  depositCumulative: decodedLiquidityPool.depositCumulative.toNumber(),
  borrowApr: decodedLiquidityPool.borrowApr.toNumber(),
  borrowCumulative: decodedLiquidityPool.borrowCumulative.toNumber(),
  lastTime: decodedLiquidityPool.lastTime.toNumber(),
  depositCommission: decodedLiquidityPool.depositCommission,
  borrowCommission: decodedLiquidityPool.borrowCommission
});
var decodedDeposit = (decodedDeposit2, address) => ({
  depositPubkey: address.toBase58(),
  liquidityPool: decodedDeposit2.liquidityPool.toBase58(),
  user: decodedDeposit2.user.toBase58(),
  amount: decodedDeposit2.amount.toNumber(),
  stakedAt: decodedDeposit2.stakedAt.toNumber(),
  stakedAtCumulative: decodedDeposit2.stakedAtCumulative.toNumber()
});
var decodedLoan = (decodedLoan2, address) => ({
  loanPubkey: address.toBase58(),
  user: decodedLoan2.user.toBase58(),
  nftMint: decodedLoan2.nftMint.toBase58(),
  nftUserTokenAccount: decodedLoan2.nftUserTokenAccount.toBase58(),
  liquidityPool: decodedLoan2.liquidityPool.toBase58(),
  collectionInfo: decodedLoan2.collectionInfo.toBase58(),
  startedAt: decodedLoan2.startedAt.toNumber(),
  expiredAt: new BN(decodedLoan2.expiredAt || 0).toNumber(),
  finishedAt: decodedLoan2.finishedAt.toNumber(),
  originalPrice: decodedLoan2.originalPrice.toNumber(),
  amountToGet: decodedLoan2.amountToGet.toNumber(),
  rewardAmount: decodedLoan2.rewardAmount.toNumber(),
  feeAmount: decodedLoan2.feeAmount.toNumber(),
  royaltyAmount: decodedLoan2.royaltyAmount.toNumber(),
  borrowedAtCumulative: new BN(decodedLoan2.rewardInterestRate || 0).toNumber(),
  alreadyPaidBack: new BN(decodedLoan2.feeInterestRate || 0).toNumber(),
  loanStatus: Object.keys(decodedLoan2.loanStatus)[0],
  loanType: Object.keys(decodedLoan2.loanType)[0]
});
var decodeLoan = (buffer, connection, programId) => {
  const program = returnAnchorProgram(programId, connection);
  return program.coder.accounts.decode("Loan", buffer);
};
var decodeLotTicket = (buffer, lotTicketPubkey, connection, programId) => {
  const program = returnAnchorProgram(programId, connection);
  const rawAccount = program.coder.accounts.decode("LotTicket", buffer);
  return anchorRawBNsAndPubkeysToNumsAndStrings({ account: rawAccount, publicKey: lotTicketPubkey });
};
var getMetaplexEditionPda = (mintPubkey) => {
  const editionPda = utils2.publicKey.findProgramAddressSync(
    [
      Buffer.from(METADATA_PREFIX),
      METADATA_PROGRAM_PUBKEY.toBuffer(),
      new web33.PublicKey(mintPubkey).toBuffer(),
      Buffer.from(EDITION_PREFIX)
    ],
    METADATA_PROGRAM_PUBKEY
  );
  return editionPda[0];
};
var anchorRawBNsAndPubkeysToNumsAndStrings = (rawAccount) => {
  const copyRawAccount = { ...rawAccount };
  for (let key in copyRawAccount.account) {
    if (copyRawAccount.account[key] === null)
      continue;
    if (copyRawAccount.account[key].toNumber) {
      copyRawAccount.account[key] = copyRawAccount.account[key].toNumber();
    }
    if (copyRawAccount.account[key].toBase58) {
      copyRawAccount.account[key] = copyRawAccount.account[key].toBase58();
    }
    if (typeof copyRawAccount.account[key] === "object") {
      copyRawAccount.account[key] = Object.keys(copyRawAccount.account[key])[0];
    }
  }
  return { ...copyRawAccount.account, publicKey: copyRawAccount.publicKey.toBase58() };
};
var knapsackAlgorithm = (items, capacity) => {
  const getLast = (memo2) => {
    let lastRow = memo2[memo2.length - 1];
    return lastRow[lastRow.length - 1];
  };
  const getSolution = (row, cap, memo2) => {
    const NO_SOLUTION = { maxValue: 0, subset: [] };
    let col = cap - 1;
    let lastItem = items[row];
    let remaining = cap - lastItem.w;
    let lastSolution = row > 0 ? memo2[row - 1][col] || NO_SOLUTION : NO_SOLUTION;
    let lastSubSolution = row > 0 ? memo2[row - 1][remaining - 1] || NO_SOLUTION : NO_SOLUTION;
    if (remaining < 0) {
      return lastSolution;
    }
    let lastValue = lastSolution.maxValue;
    let lastSubValue = lastSubSolution.maxValue;
    let newValue = lastSubValue + lastItem.v;
    if (newValue >= lastValue) {
      let _lastSubSet = lastSubSolution.subset.slice();
      _lastSubSet.push(lastItem);
      return { maxValue: newValue, subset: _lastSubSet };
    } else {
      return lastSolution;
    }
  };
  let memo = [];
  for (let i = 0; i < items.length; i++) {
    let row = [];
    for (let cap = 1; cap <= capacity; cap++) {
      row.push(getSolution(i, cap, memo));
    }
    memo.push(row);
  }
  return getLast(memo);
};
var getMostOptimalLoansClosestToNeededSolInBulk = ({
  neededSol,
  possibleLoans
}) => {
  const divider = 1e7;
  const preparedItems = possibleLoans.map((loan) => ({
    ...loan,
    v: Math.ceil((loan.loanValue - loan.interest) / divider),
    w: Math.ceil(loan.loanValue / divider)
  }));
  const preparedNeededSol = Math.ceil(neededSol / divider);
  const { maxValue, subset } = knapsackAlgorithm(preparedItems, preparedNeededSol);
  const result = subset.map((item) => ({ nftMint: item.nftMint, loanValue: item.loanValue, interest: item.interest }));
  return result;
};
function objectBNsAndPubkeysToNums(obj) {
  const copyobj = { ...obj };
  for (const key in copyobj.account) {
    if (copyobj.account[key] === null)
      continue;
    if (copyobj.account[key].toNumber) {
      copyobj.account[key] = copyobj.account[key].toNumber();
    }
    if (copyobj.account[key].toBase58) {
      copyobj.account[key] = copyobj.account[key].toBase58();
    }
    if (typeof copyobj.account[key] === "object") {
      copyobj.account[key] = Object.keys(copyobj.account[key])[0];
    }
  }
  return { ...copyobj.account, publicKey: copyobj.publicKey.toBase58() };
}

// src/loans/functions/private/approveLoanByAdmin.ts
var approveLoanByAdmin = async ({
  programId,
  connection,
  admin,
  loan,
  liquidityPool,
  collectionInfo,
  nftPrice,
  discount,
  user,
  sendTxn
}) => {
  const encoder = new TextEncoder();
  const program = returnAnchorProgram(programId, connection);
  const [liqOwner] = await web34.PublicKey.findProgramAddress(
    [encoder.encode("nftlendingv2"), liquidityPool.toBuffer()],
    programId
  );
  const instruction = program.instruction.approveLoanByAdmin(new BN2(nftPrice), new BN2(discount), {
    accounts: {
      loan,
      user,
      liquidityPool,
      liqOwner,
      collectionInfo,
      admin,
      systemProgram: web34.SystemProgram.programId
    }
  });
  const transaction = new web34.Transaction().add(instruction);
  await sendTxn(transaction);
};

// src/loans/functions/private/closeLoanByAdmin.ts
import { web3 as web35 } from "@project-serum/anchor";
var closeLoanByAdmin = async ({ programId, connection, loan, admin, sendTxn }) => {
  const encoder = new TextEncoder();
  const program = returnAnchorProgram(programId, connection);
  const [communityPoolsAuthority, bumpPoolsAuth] = await web35.PublicKey.findProgramAddress(
    [encoder.encode("nftlendingv2"), programId.toBuffer()],
    programId
  );
  const instruction = await program.methods.closeLoan(bumpPoolsAuth).accounts({
    loan,
    admin,
    communityPoolsAuthority
  }).instruction();
  const transaction = new web35.Transaction().add(instruction);
  await sendTxn(transaction);
};

// src/loans/functions/private/initializeCollectionInfo.ts
import { BN as BN3, web3 as web36 } from "@project-serum/anchor";
var initializeCollectionInfo = async ({
  programId,
  connection,
  liquidityPool,
  admin,
  creatorAddress,
  pricingLookupAddress,
  loanToValue,
  collaterizationRate,
  royaltyAddress,
  royaltyFeeTime,
  royaltyFeePrice,
  expirationTime,
  isPriceBased,
  sendTxn
}) => {
  const program = returnAnchorProgram(programId, connection);
  const collectionInfo = web36.Keypair.generate();
  const instruction = program.instruction.initializeCollectionInfo(
    {
      loanToValue: new BN3(loanToValue),
      collaterizationRate: new BN3(collaterizationRate),
      royaltyFeeTime: new BN3(royaltyFeeTime),
      royaltyFeePrice: new BN3(royaltyFeePrice),
      expirationTime: new BN3(expirationTime),
      isPriceBased
    },
    {
      accounts: {
        liquidityPool,
        collectionInfo: collectionInfo.publicKey,
        admin,
        creatorAddress,
        royaltyAddress,
        pricingLookupAddress,
        rent: web36.SYSVAR_RENT_PUBKEY,
        systemProgram: web36.SystemProgram.programId
      }
    }
  );
  const transaction = new web36.Transaction().add(instruction);
  await sendTxn(transaction, [collectionInfo]);
  return collectionInfo.publicKey;
};

// src/loans/functions/private/initializePriceBasedLiquidityPool.ts
import { web3 as web37 } from "@project-serum/anchor";
var initializePriceBasedLiquidityPool = async ({
  programId,
  connection,
  admin,
  baseBorrowRate,
  variableSlope1,
  variableSlope2,
  utilizationRateOptimal,
  reserveFactor,
  depositCommission,
  borrowCommission,
  id,
  sendTxn
}) => {
  const program = returnAnchorProgram(programId, connection);
  const encoder = new TextEncoder();
  const liquidityPool = web37.Keypair.generate();
  const [liqOwner, liqOwnerBump] = await web37.PublicKey.findProgramAddress(
    [encoder.encode("nftlendingv2"), liquidityPool.publicKey.toBuffer()],
    program.programId
  );
  const ix = program.instruction.initializePriceBasedLiquidityPool(
    liqOwnerBump,
    {
      id,
      baseBorrowRate,
      variableSlope1,
      variableSlope2,
      utilizationRateOptimal,
      reserveFactor,
      depositCommission,
      borrowCommission
    },
    {
      accounts: {
        liquidityPool: liquidityPool.publicKey,
        liqOwner,
        admin,
        rent: web37.SYSVAR_RENT_PUBKEY,
        systemProgram: web37.SystemProgram.programId
      }
    }
  );
  const transaction = new web37.Transaction().add(ix);
  await sendTxn(transaction, [liquidityPool]);
  return liquidityPool.publicKey;
};

// src/loans/functions/private/initializeTimeBasedLiquidityPool.ts
import { BN as BN4, web3 as web38 } from "@project-serum/anchor";
var initializeTimeBasedLiquidityPool = async ({
  programId,
  connection,
  admin,
  rewardInterestRateTime,
  feeInterestRateTime,
  rewardInterestRatePrice,
  feeInterestRatePrice,
  id,
  period,
  sendTxn
}) => {
  const encoder = new TextEncoder();
  const program = returnAnchorProgram(programId, connection);
  const liquidityPool = web38.Keypair.generate();
  const [liqOwner, liqOwnerBump] = await web38.PublicKey.findProgramAddress(
    [encoder.encode("nftlendingv2"), liquidityPool.publicKey.toBuffer()],
    program.programId
  );
  const instruction = program.instruction.initializeTimeBasedLiquidityPool(
    liqOwnerBump,
    {
      rewardInterestRateTime: new BN4(rewardInterestRateTime),
      rewardInterestRatePrice: new BN4(rewardInterestRatePrice),
      feeInterestRateTime: new BN4(feeInterestRateTime),
      feeInterestRatePrice: new BN4(feeInterestRatePrice),
      id: new BN4(id),
      period: new BN4(period)
    },
    {
      accounts: {
        liquidityPool: liquidityPool.publicKey,
        liqOwner,
        admin,
        rent: web38.SYSVAR_RENT_PUBKEY,
        systemProgram: web38.SystemProgram.programId
      }
    }
  );
  const transaction = new web38.Transaction().add(instruction);
  await sendTxn(transaction, [liquidityPool]);
  return liquidityPool.publicKey;
};

// src/loans/functions/private/liquidateLoanByAdmin.ts
import { web3 as web39, utils as utils3 } from "@project-serum/anchor";
var liquidateLoanByAdmin = async ({
  programId,
  connection,
  liquidator,
  user,
  loan,
  nftMint,
  sendTxn
}) => {
  const encoder = new TextEncoder();
  const program = returnAnchorProgram(programId, connection);
  const nftUserTokenAccount = await findAssociatedTokenAddress(user, nftMint);
  const nftLiquidatorTokenAccount = await findAssociatedTokenAddress(liquidator, nftMint);
  const editionId = getMetaplexEditionPda(nftMint);
  const [communityPoolsAuthority, bumpPoolsAuth] = await web39.PublicKey.findProgramAddress(
    [encoder.encode("nftlendingv2"), programId.toBuffer()],
    program.programId
  );
  const instruction = program.instruction.liquidateLoanByAdmin(bumpPoolsAuth, {
    accounts: {
      loan,
      liquidator,
      nftMint,
      nftLiquidatorTokenAccount,
      user,
      nftUserTokenAccount,
      communityPoolsAuthority,
      rent: web39.SYSVAR_RENT_PUBKEY,
      systemProgram: web39.SystemProgram.programId,
      tokenProgram: utils3.token.TOKEN_PROGRAM_ID,
      associatedTokenProgram: utils3.token.ASSOCIATED_PROGRAM_ID,
      metadataProgram: METADATA_PROGRAM_PUBKEY,
      editionInfo: editionId
    }
  });
  const transaction = new web39.Transaction().add(instruction);
  await sendTxn(transaction);
};

// src/loans/functions/private/revealLotTicketByAdmin.ts
import { web3 as web310 } from "@project-serum/anchor";
var revealLotTicketByAdmin = async ({
  programId,
  connection,
  admin,
  lotTicket,
  isWinning,
  sendTxn
}) => {
  const program = returnAnchorProgram(programId, connection);
  const ix = program.instruction.revealLotTicketByAdmin(isWinning, {
    accounts: {
      admin,
      lotTicket
    }
  });
  const transaction = new web310.Transaction().add(ix);
  await sendTxn(transaction);
};

// src/loans/functions/private/rejectLoanByAdmin.ts
import { web3 as web311, utils as utils4 } from "@project-serum/anchor";
var rejectLoanByAdmin = async ({
  programId,
  connection,
  loan,
  nftUserTokenAccount,
  admin,
  user,
  nftMint,
  sendTxn
}) => {
  const encoder = new TextEncoder();
  const program = returnAnchorProgram(programId, connection);
  const editionId = getMetaplexEditionPda(nftMint);
  const [communityPoolsAuthority, bumpPoolsAuth] = await web311.PublicKey.findProgramAddress(
    [encoder.encode("nftlendingv2"), programId.toBuffer()],
    programId
  );
  const instruction = program.instruction.rejectLoanByAdmin(bumpPoolsAuth, {
    accounts: {
      loan,
      admin,
      nftMint,
      nftUserTokenAccount,
      user,
      communityPoolsAuthority,
      tokenProgram: utils4.token.TOKEN_PROGRAM_ID,
      systemProgram: web311.SystemProgram.programId,
      metadataProgram: METADATA_PROGRAM_PUBKEY,
      editionInfo: editionId
    }
  });
  const transaction = new web311.Transaction().add(instruction);
  await sendTxn(transaction);
};

// src/loans/functions/private/updateCollectionInfo.ts
import { BN as BN5, web3 as web312 } from "@project-serum/anchor";
var updateCollectionInfo = async ({
  programId,
  connection,
  liquidityPool,
  admin,
  creatorAddress,
  collectionInfo,
  pricingLookupAddress,
  loanToValue,
  collaterizationRate,
  royaltyAddress,
  royaltyFeeTime,
  royaltyFeePrice,
  expirationTime,
  isPriceBased,
  sendTxn
}) => {
  const program = returnAnchorProgram(programId, connection);
  const instruction = program.instruction.updateCollectionInfo(
    {
      loanToValue: new BN5(loanToValue),
      collaterizationRate: new BN5(collaterizationRate),
      royaltyFeeTime: new BN5(royaltyFeeTime),
      royaltyFeePrice: new BN5(royaltyFeePrice),
      expirationTime: new BN5(expirationTime),
      isPriceBased
    },
    {
      accounts: {
        liquidityPool,
        collectionInfo,
        admin,
        creatorAddress,
        royaltyAddress,
        pricingLookupAddress
      }
    }
  );
  const transaction = new web312.Transaction().add(instruction);
  await sendTxn(transaction);
};

// src/loans/functions/private/updatePriceBasedLiquidityPool.ts
import { web3 as web313 } from "@project-serum/anchor";
var updatePriceBasedLiquidityPool = async ({
  programId,
  liquidityPool,
  connection,
  admin,
  baseBorrowRate,
  variableSlope1,
  variableSlope2,
  utilizationRateOptimal,
  reserveFactor,
  depositCommission,
  borrowCommission,
  id,
  sendTxn
}) => {
  const program = returnAnchorProgram(programId, connection);
  const ix = program.instruction.updatePriceBasedLiquidityPool(
    {
      id,
      baseBorrowRate,
      variableSlope1,
      variableSlope2,
      utilizationRateOptimal,
      reserveFactor,
      depositCommission,
      borrowCommission
    },
    {
      accounts: {
        liquidityPool,
        admin,
        rent: web313.SYSVAR_RENT_PUBKEY,
        systemProgram: web313.SystemProgram.programId
      }
    }
  );
  const transaction = new web313.Transaction().add(ix);
  await sendTxn(transaction);
};

// src/loans/functions/private/updateTimeBasedLiquidityPool.ts
import { BN as BN6, web3 as web314 } from "@project-serum/anchor";
var updateTimeBasedLiquidityPool = async ({
  programId,
  connection,
  admin,
  liquidityPool,
  rewardInterestRateTime,
  feeInterestRateTime,
  rewardInterestRatePrice,
  feeInterestRatePrice,
  id,
  period,
  sendTxn
}) => {
  const program = returnAnchorProgram(programId, connection);
  const instruction = program.instruction.updateLiquidityPool(
    {
      rewardInterestRateTime: new BN6(rewardInterestRateTime),
      rewardInterestRatePrice: new BN6(rewardInterestRatePrice),
      feeInterestRateTime: new BN6(feeInterestRateTime),
      feeInterestRatePrice: new BN6(feeInterestRatePrice),
      id: new BN6(id),
      period: new BN6(period)
    },
    {
      accounts: {
        liquidityPool,
        admin,
        rent: web314.SYSVAR_RENT_PUBKEY,
        systemProgram: web314.SystemProgram.programId
      }
    }
  );
  const transaction = new web314.Transaction().add(instruction);
  await sendTxn(transaction);
};

// src/loans/functions/private/liquidateLoanToRaffles.ts
import { web3 as web315, utils as utils5, BN as BN7 } from "@project-serum/anchor";
var liquidateLoanToRaffles = async ({
  programId,
  connection,
  user,
  liquidator,
  gracePeriod,
  loan,
  nftMint,
  sendTxn
}) => {
  const encoder = new TextEncoder();
  const program = returnAnchorProgram(programId, connection);
  const [communityPoolsAuthority, bumpPoolsAuth] = await web315.PublicKey.findProgramAddress(
    [encoder.encode("nftlendingv2"), programId.toBuffer()],
    program.programId
  );
  const nftUserTokenAccount = await findAssociatedTokenAddress(user, nftMint);
  const vaultNftTokenAccount = await findAssociatedTokenAddress(communityPoolsAuthority, nftMint);
  const editionId = getMetaplexEditionPda(nftMint);
  const liquidationLot = web315.Keypair.generate();
  const ix = program.instruction.liquidateNftToRaffles(bumpPoolsAuth, new BN7(gracePeriod), {
    accounts: {
      loan,
      liquidationLot: liquidationLot.publicKey,
      user,
      liquidator,
      nftMint,
      vaultNftTokenAccount,
      nftUserTokenAccount,
      communityPoolsAuthority,
      systemProgram: web315.SystemProgram.programId,
      tokenProgram: utils5.token.TOKEN_PROGRAM_ID,
      associatedTokenProgram: utils5.token.ASSOCIATED_PROGRAM_ID,
      metadataProgram: METADATA_PROGRAM_PUBKEY,
      editionInfo: editionId,
      rent: web315.SYSVAR_RENT_PUBKEY
    }
  });
  const transaction = new web315.Transaction().add(ix);
  await sendTxn(transaction, [liquidationLot]);
  return liquidationLot.publicKey;
};

// src/loans/functions/private/stopLiquidationRaffles.ts
import { web3 as web316, utils as utils6 } from "@project-serum/anchor";
var stopLiquidationRaffles = async ({
  programId,
  connection,
  admin,
  nftMint,
  liquidationLot,
  loan,
  sendTxn
}) => {
  const encoder = new TextEncoder();
  const program = returnAnchorProgram(programId, connection);
  const nftAdminTokenAccount = await findAssociatedTokenAddress(admin, nftMint);
  const [communityPoolsAuthority, bumpPoolsAuth] = await web316.PublicKey.findProgramAddress(
    [encoder.encode("nftlendingv2"), programId.toBuffer()],
    program.programId
  );
  const vaultNftTokenAccount = await findAssociatedTokenAddress(communityPoolsAuthority, nftMint);
  const ix = program.instruction.stopLiquidationRafflesByAdmin(bumpPoolsAuth, {
    accounts: {
      admin,
      nftMint,
      communityPoolsAuthority,
      liquidationLot,
      loan,
      vaultNftTokenAccount,
      nftAdminTokenAccount,
      tokenProgram: utils6.token.TOKEN_PROGRAM_ID,
      associatedTokenProgram: utils6.token.ASSOCIATED_PROGRAM_ID,
      systemProgram: web316.SystemProgram.programId,
      rent: web316.SYSVAR_RENT_PUBKEY
    }
  });
  const transaction = new web316.Transaction().add(ix);
  await sendTxn(transaction);
};

// src/loans/functions/private/unstakeGemFarmByAdmin.ts
import { web3 as web317, utils as utils7 } from "@project-serum/anchor";
var unstakeGemFarmByAdmin = async ({
  programId,
  connection,
  admin,
  gemFarm,
  gemBank,
  farm,
  bank,
  feeAcc,
  nftMint,
  loan,
  isDegod,
  sendTxn
}) => {
  const encoder = new TextEncoder();
  const program = returnAnchorProgram(programId, connection);
  const [communityPoolsAuthority, bumpPoolsAuth] = await web317.PublicKey.findProgramAddress(
    [encoder.encode("nftlendingv2"), programId.toBuffer()],
    program.programId
  );
  const [identity, bumpAuth] = await web317.PublicKey.findProgramAddress(
    [encoder.encode("degod_stake"), nftMint.toBuffer(), loan.toBuffer()],
    programId
  );
  const editionId = getMetaplexEditionPda(nftMint);
  const [farmer, bumpFarmer] = await web317.PublicKey.findProgramAddress(
    [encoder.encode("farmer"), farm.toBuffer(), identity.toBuffer()],
    gemFarm
  );
  const [lendingStake] = await web317.PublicKey.findProgramAddress(
    [encoder.encode("stake_acc"), loan.toBuffer()],
    programId
  );
  const [vault, _bumpVault] = await web317.PublicKey.findProgramAddress(
    [encoder.encode("vault"), bank.toBuffer(), identity.toBuffer()],
    gemBank
  );
  const [bankAuthority, bumpAuthVaultAuthority] = await web317.PublicKey.findProgramAddress(
    [vault.toBuffer()],
    gemBank
  );
  const [gemBox, bumpGemBox] = await web317.PublicKey.findProgramAddress(
    [encoder.encode("gem_box"), vault.toBuffer(), nftMint.toBuffer()],
    gemBank
  );
  const [gemDepositReceipt, bumpGdr] = await web317.PublicKey.findProgramAddress(
    [encoder.encode("gem_deposit_receipt"), vault.toBuffer(), nftMint.toBuffer()],
    gemBank
  );
  const [gemRarity, bumpRarity] = await web317.PublicKey.findProgramAddress(
    [encoder.encode("gem_rarity"), bank.toBuffer(), nftMint.toBuffer()],
    gemBank
  );
  const [farmTreasury, bumpTreasury] = await web317.PublicKey.findProgramAddress(
    [encoder.encode("treasury"), farm.toBuffer()],
    gemFarm
  );
  const [farmAuthority, bumpAuthAuthority] = await web317.PublicKey.findProgramAddress(
    [farm.toBuffer()],
    gemFarm
  );
  const nftUserTokenAccount = await findAssociatedTokenAddress(admin, nftMint);
  const additionalComputeBudgetInstruction = web317.ComputeBudgetProgram.requestUnits({
    units: 4e5,
    additionalFee: 0
  });
  const ix = program.instruction.unstakeGemFarmStaking(
    {
      bumpPoolsAuth,
      bumpAuth,
      bumpAuthVaultAuthority,
      bumpTreasury,
      bumpFarmer,
      bumpAuthAuthority,
      bumpGemBox,
      bumpGdr,
      isDegod,
      bumpRarity
    },
    {
      accounts: {
        admin,
        gemFarm,
        farm,
        farmAuthority,
        farmer,
        farmTreasury,
        lendingStake,
        loan,
        identity,
        bank,
        gemBank,
        feeAcc,
        vault,
        authority: bankAuthority,
        gemBox,
        gemDepositReceipt,
        gemSource: nftUserTokenAccount,
        gemMint: nftMint,
        gemRarity,
        communityPoolsAuthority,
        metadataProgram: METADATA_PROGRAM_PUBKEY,
        editionInfo: editionId,
        rent: web317.SYSVAR_RENT_PUBKEY,
        systemProgram: web317.SystemProgram.programId,
        tokenProgram: utils7.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: utils7.token.ASSOCIATED_PROGRAM_ID
      }
    }
  );
  const transaction = new web317.Transaction().add(additionalComputeBudgetInstruction).add(ix);
  await sendTxn(transaction);
};

// src/loans/functions/private/putLoanToLiquidationRaffles.ts
import { web3 as web318, utils as utils8, BN as BN8 } from "@project-serum/anchor";
var putLoanToLiquidationRaffles = async ({
  programId,
  connection,
  admin,
  loan,
  nftMint,
  gracePeriod,
  sendTxn
}) => {
  const encoder = new TextEncoder();
  const program = returnAnchorProgram(programId, connection);
  const nftAdminTokenAccount = await findAssociatedTokenAddress(admin, nftMint);
  const [communityPoolsAuthority, bumpPoolsAuth] = await web318.PublicKey.findProgramAddress(
    [encoder.encode("nftlendingv2"), programId.toBuffer()],
    program.programId
  );
  const vaultNftTokenAccount = await findAssociatedTokenAddress(communityPoolsAuthority, nftMint);
  const liquidationLotAccount = web318.Keypair.generate();
  const instruction = program.instruction.putLoanToLiquidationRaffles(bumpPoolsAuth, new BN8(gracePeriod), {
    accounts: {
      loan,
      liquidationLot: liquidationLotAccount.publicKey,
      admin,
      nftMint,
      vaultNftTokenAccount,
      nftAdminTokenAccount,
      communityPoolsAuthority,
      tokenProgram: utils8.token.TOKEN_PROGRAM_ID,
      rent: web318.SYSVAR_RENT_PUBKEY,
      systemProgram: web318.SystemProgram.programId,
      associatedTokenProgram: utils8.token.ASSOCIATED_PROGRAM_ID
    }
  });
  const transaction = new web318.Transaction().add(instruction);
  await sendTxn(transaction, [liquidationLotAccount]);
  return liquidationLotAccount.publicKey;
};

// src/loans/functions/public/depositLiquidity.ts
import { BN as BN9, web3 as web319 } from "@project-serum/anchor";
var depositLiquidity = async ({
  programId,
  liquidityPool,
  connection,
  user,
  amount,
  sendTxn
}) => {
  const encoder = new TextEncoder();
  const program = returnAnchorProgram(programId, connection);
  const [liqOwner] = await web319.PublicKey.findProgramAddress(
    [encoder.encode("nftlendingv2"), liquidityPool.toBuffer()],
    program.programId
  );
  const [deposit] = await web319.PublicKey.findProgramAddress(
    [encoder.encode("deposit"), liquidityPool.toBuffer(), user.toBuffer()],
    program.programId
  );
  const instruction = program.instruction.depositLiquidity(new BN9(amount), {
    accounts: {
      liquidityPool,
      liqOwner,
      deposit,
      user,
      rent: web319.SYSVAR_RENT_PUBKEY,
      systemProgram: web319.SystemProgram.programId
    }
  });
  const transaction = new web319.Transaction().add(instruction);
  await sendTxn(transaction);
  return deposit;
};

// src/loans/functions/public/getAllProgramAccounts.ts
var getAllProgramAccounts = async (programId, connection) => {
  let program = returnAnchorProgram(programId, connection);
  const collectionInfoRaws = await program.account.collectionInfo.all();
  const depositRaws = await program.account.deposit.all();
  const liquidityPoolRaws = await program.account.liquidityPool.all();
  const priceBasedLiquidityPoolRaws = await program.account.priceBasedLiquidityPool.all();
  const loanRaws = await program.account.loan.all();
  const liquidationLotRaws = await program.account.liquidationLot.all();
  const stakesRaw = await program.account.lendingStake.all();
  const lotTicketRaws = await program.account.lotTicket.all();
  const nftAttemptsRaws = await program.account.nftAttempts.all();
  const collectionInfos = collectionInfoRaws.map((raw) => decodedCollectionInfo(raw.account, raw.publicKey));
  const deposits = depositRaws.map((raw) => decodedDeposit(raw.account, raw.publicKey));
  const timeBasedLiquidityPools = liquidityPoolRaws.map((raw) => decodedTimeBasedLiquidityPool(raw.account, raw.publicKey));
  const priceBasedLiquidityPools = priceBasedLiquidityPoolRaws.map((raw) => decodedPriceBasedLiquidityPool(raw.account, raw.publicKey));
  const loans = loanRaws.map((raw) => decodedLoan(raw.account, raw.publicKey));
  const lendingStakes = stakesRaw.map((raw) => decodedLendingStake(raw.account, raw.publicKey));
  const liquidationLots = liquidationLotRaws.map(objectBNsAndPubkeysToNums);
  const lotTickets = lotTicketRaws.map(objectBNsAndPubkeysToNums);
  const nftAttempts = nftAttemptsRaws.map(objectBNsAndPubkeysToNums);
  return {
    collectionInfos,
    deposits,
    timeBasedLiquidityPools,
    priceBasedLiquidityPools,
    loans,
    lendingStakes,
    liquidationLots,
    lotTickets,
    nftAttempts
  };
};

// src/loans/functions/public/harvestLiquidity.ts
import { web3 as web320 } from "@project-serum/anchor";
var harvestLiquidity = async ({
  programId,
  adminPubkey,
  connection,
  liquidityPool,
  user,
  sendTxn
}) => {
  const encoder = new TextEncoder();
  const program = returnAnchorProgram(programId, connection);
  const [liqOwner] = await web320.PublicKey.findProgramAddress(
    [encoder.encode("nftlendingv2"), liquidityPool.toBuffer()],
    program.programId
  );
  const [deposit, depositBump] = await web320.PublicKey.findProgramAddress(
    [encoder.encode("deposit"), liquidityPool.toBuffer(), user.toBuffer()],
    program.programId
  );
  const instruction = program.instruction.harvestLiquidity(depositBump, {
    accounts: {
      liquidityPool,
      user,
      deposit,
      liqOwner,
      systemProgram: web320.SystemProgram.programId,
      admin: adminPubkey
    }
  });
  const transaction = new web320.Transaction().add(instruction);
  await sendTxn(transaction);
};

// src/loans/functions/public/paybackLoan.ts
import { web3 as web321, utils as utils9, BN as BN10 } from "@project-serum/anchor";
var paybackLoan = async ({
  programId,
  connection,
  user,
  admin,
  loan,
  nftMint,
  liquidityPool,
  collectionInfo,
  royaltyAddress,
  paybackAmount = new BN10(0),
  sendTxn
}) => {
  const encoder = new TextEncoder();
  const program = returnAnchorProgram(programId, connection);
  const [communityPoolsAuthority, bumpPoolsAuth] = await web321.PublicKey.findProgramAddress(
    [encoder.encode("nftlendingv2"), programId.toBuffer()],
    program.programId
  );
  const [liqOwner] = await web321.PublicKey.findProgramAddress(
    [encoder.encode("nftlendingv2"), liquidityPool.toBuffer()],
    program.programId
  );
  const nftUserTokenAccount = await findAssociatedTokenAddress(user, nftMint);
  const editionId = getMetaplexEditionPda(nftMint);
  const instruction = program.instruction.paybackLoan(bumpPoolsAuth, paybackAmount, {
    accounts: {
      loan,
      liquidityPool,
      collectionInfo,
      user,
      admin,
      nftMint,
      nftUserTokenAccount,
      royaltyAddress,
      liqOwner,
      communityPoolsAuthority,
      systemProgram: web321.SystemProgram.programId,
      tokenProgram: utils9.token.TOKEN_PROGRAM_ID,
      metadataProgram: METADATA_PROGRAM_PUBKEY,
      editionInfo: editionId
    }
  });
  const transaction = new web321.Transaction().add(instruction);
  await sendTxn(transaction);
};

// src/loans/functions/public/paybackLoanIx.ts
import { web3 as web322, utils as utils10, BN as BN11 } from "@project-serum/anchor";
var paybackLoanIx = async ({
  programId,
  connection,
  user,
  admin,
  loan,
  nftMint,
  liquidityPool,
  collectionInfo,
  royaltyAddress,
  paybackAmount = new BN11(0)
}) => {
  const encoder = new TextEncoder();
  const program = returnAnchorProgram(programId, connection);
  const [communityPoolsAuthority, bumpPoolsAuth] = await web322.PublicKey.findProgramAddress(
    [encoder.encode("nftlendingv2"), programId.toBuffer()],
    program.programId
  );
  const [liqOwner] = await web322.PublicKey.findProgramAddress(
    [encoder.encode("nftlendingv2"), liquidityPool.toBuffer()],
    program.programId
  );
  const nftUserTokenAccount = await findAssociatedTokenAddress(user, nftMint);
  const editionId = getMetaplexEditionPda(nftMint);
  const instruction = program.instruction.paybackLoan(bumpPoolsAuth, paybackAmount, {
    accounts: {
      loan,
      liquidityPool,
      collectionInfo,
      user,
      admin,
      nftMint,
      nftUserTokenAccount,
      royaltyAddress,
      liqOwner,
      communityPoolsAuthority,
      systemProgram: web322.SystemProgram.programId,
      tokenProgram: utils10.token.TOKEN_PROGRAM_ID,
      metadataProgram: METADATA_PROGRAM_PUBKEY,
      editionInfo: editionId
    }
  });
  return { paybackLoanIx: instruction };
};

// src/loans/functions/public/proposeLoan.ts
import { web3 as web323, utils as utils11 } from "@project-serum/anchor";
var proposeLoan = async ({
  proposedNftPrice,
  programId,
  connection,
  user,
  nftMint,
  isPriceBased,
  loanToValue,
  admin,
  sendTxn
}) => {
  const program = returnAnchorProgram(programId, connection);
  const loan = web323.Keypair.generate();
  const encoder = new TextEncoder();
  const [communityPoolsAuthority, bumpPoolsAuth] = await web323.PublicKey.findProgramAddress(
    [encoder.encode("nftlendingv2"), programId.toBuffer()],
    programId
  );
  const editionId = getMetaplexEditionPda(nftMint);
  const nftUserTokenAccount = await findAssociatedTokenAddress(user, nftMint);
  const ix = program.instruction.proposeLoan(bumpPoolsAuth, isPriceBased, proposedNftPrice, loanToValue, {
    accounts: {
      loan: loan.publicKey,
      user,
      nftUserTokenAccount,
      nftMint,
      communityPoolsAuthority,
      tokenProgram: utils11.token.TOKEN_PROGRAM_ID,
      rent: web323.SYSVAR_RENT_PUBKEY,
      systemProgram: web323.SystemProgram.programId,
      metadataProgram: METADATA_PROGRAM_PUBKEY,
      admin,
      editionInfo: editionId
    }
  });
  const transaction = new web323.Transaction().add(ix);
  await sendTxn(transaction, [loan]);
  return { loanPubkey: loan.publicKey };
};
var proposeLoanIx = async ({
  proposedNftPrice,
  programId,
  connection,
  user,
  nftMint,
  isPriceBased,
  loanToValue,
  admin
}) => {
  const program = returnAnchorProgram(programId, connection);
  const loan = web323.Keypair.generate();
  const encoder = new TextEncoder();
  const [communityPoolsAuthority, bumpPoolsAuth] = await web323.PublicKey.findProgramAddress(
    [encoder.encode("nftlendingv2"), programId.toBuffer()],
    programId
  );
  const editionId = getMetaplexEditionPda(nftMint);
  const nftUserTokenAccount = await findAssociatedTokenAddress(user, nftMint);
  const ix = program.instruction.proposeLoan(bumpPoolsAuth, isPriceBased, proposedNftPrice, loanToValue, {
    accounts: {
      loan: loan.publicKey,
      user,
      nftUserTokenAccount,
      nftMint,
      communityPoolsAuthority,
      tokenProgram: utils11.token.TOKEN_PROGRAM_ID,
      rent: web323.SYSVAR_RENT_PUBKEY,
      systemProgram: web323.SystemProgram.programId,
      metadataProgram: METADATA_PROGRAM_PUBKEY,
      admin,
      editionInfo: editionId
    },
    signers: [loan]
  });
  return { ix, loan };
};

// src/loans/functions/public/unstakeLiquidity.ts
import { BN as BN13, web3 as web324 } from "@project-serum/anchor";
var unstakeLiquidity = async ({
  programId,
  connection,
  liquidityPool,
  adminPubkey,
  user,
  amount,
  sendTxn
}) => {
  const encoder = new TextEncoder();
  const program = await returnAnchorProgram(programId, connection);
  const [liqOwner] = await web324.PublicKey.findProgramAddress(
    [encoder.encode("nftlendingv2"), liquidityPool.toBuffer()],
    program.programId
  );
  const [deposit, depositBump] = await web324.PublicKey.findProgramAddress(
    [encoder.encode("deposit"), liquidityPool.toBuffer(), user.toBuffer()],
    program.programId
  );
  const instruction = program.instruction.unstakeLiquidity(depositBump, new BN13(amount), {
    accounts: {
      liquidityPool,
      user,
      deposit,
      liqOwner,
      systemProgram: web324.SystemProgram.programId,
      admin: adminPubkey
    }
  });
  const transaction = new web324.Transaction().add(instruction);
  await sendTxn(transaction);
};

// src/loans/functions/public/redeemWinningLotTicket.ts
import { web3 as web325, utils as utils12 } from "@project-serum/anchor";
var redeemWinningLotTicket = async ({
  programId,
  connection,
  user,
  liquidationLot,
  liquidityPool,
  collectionInfo,
  loan,
  admin,
  lotTicket,
  royaltyAddress,
  nftMint,
  sendTxn
}) => {
  const encoder = new TextEncoder();
  const program = returnAnchorProgram(programId, connection);
  const [communityPoolsAuthority, bumpPoolsAuth] = await web325.PublicKey.findProgramAddress(
    [encoder.encode("nftlendingv2"), programId.toBuffer()],
    program.programId
  );
  const [liqOwner, liqOwnerBump] = await web325.PublicKey.findProgramAddress(
    [encoder.encode("nftlendingv2"), liquidityPool.toBuffer()],
    program.programId
  );
  const nftUserTokenAccount = await findAssociatedTokenAddress(user, nftMint);
  const vaultNftTokenAccount = await findAssociatedTokenAddress(communityPoolsAuthority, nftMint);
  const editionId = getMetaplexEditionPda(nftMint);
  const instr = program.instruction.redeemWinningLotTicket(bumpPoolsAuth, {
    accounts: {
      loan,
      liquidityPool,
      liquidationLot,
      lotTicket,
      collectionInfo,
      user,
      admin,
      nftMint,
      nftUserTokenAccount,
      royaltyAddress,
      liqOwner,
      communityPoolsAuthority,
      vaultNftTokenAccount,
      systemProgram: web325.SystemProgram.programId,
      tokenProgram: utils12.token.TOKEN_PROGRAM_ID,
      associatedTokenProgram: utils12.token.ASSOCIATED_PROGRAM_ID,
      metadataProgram: METADATA_PROGRAM_PUBKEY,
      editionInfo: editionId,
      rent: web325.SYSVAR_RENT_PUBKEY
    }
  });
  const transaction = new web325.Transaction().add(instr);
  await sendTxn(transaction);
};

// src/loans/functions/public/getLotTicket.ts
import { web3 as web326 } from "@project-serum/anchor";
var getLotTicket = async ({
  programId,
  connection,
  user,
  liquidationLot,
  attemptsNftMint,
  sendTxn
}) => {
  const encoder = new TextEncoder();
  let program = returnAnchorProgram(programId, connection);
  const lotTicket = web326.Keypair.generate();
  const [nftAttempts, nftAttemptsBump] = await web326.PublicKey.findProgramAddress(
    [encoder.encode("nftattempts"), programId.toBuffer(), attemptsNftMint.toBuffer()],
    program.programId
  );
  const instructions = [];
  if (!await connection.getAccountInfo(nftAttempts, "confirmed")) {
    instructions.push(
      program.instruction.initializeNftAttempts({
        accounts: {
          nftAttempts,
          user,
          nftMint: attemptsNftMint,
          rent: web326.SYSVAR_RENT_PUBKEY,
          systemProgram: web326.SystemProgram.programId
        }
      })
    );
  }
  const nftUserTokenAccount = await findAssociatedTokenAddress(user, attemptsNftMint);
  instructions.push(
    program.instruction.getLotTicket(nftAttemptsBump, {
      accounts: {
        liquidationLot,
        nftAttempts,
        user,
        lotTicket: lotTicket.publicKey,
        attemptsNftMint,
        systemProgram: web326.SystemProgram.programId,
        nftUserTokenAccount
      }
    })
  );
  const transaction = new web326.Transaction();
  for (let instruction of instructions)
    transaction.add(instruction);
  await sendTxn(transaction, [lotTicket]);
  return lotTicket.publicKey;
};

// src/loans/functions/public/initializeNftAttemptsByStaking.ts
import { web3 as web327 } from "@project-serum/anchor";
var initializeNftAttemptsByStaking = async ({
  programId,
  connection,
  user,
  fraktNftStake,
  attemptsNftMint,
  sendTxn
}) => {
  const encoder = new TextEncoder();
  let program = returnAnchorProgram(programId, connection);
  const lotTicket = web327.Keypair.generate();
  const [nftAttempts, nftAttemptsBump] = await web327.PublicKey.findProgramAddress(
    [encoder.encode("nftattempts"), programId.toBuffer(), attemptsNftMint.toBuffer()],
    program.programId
  );
  const instructions = [];
  if (!await connection.getAccountInfo(nftAttempts, "confirmed")) {
    instructions.push(
      program.instruction.initializeNftAttemptsByStaking({
        accounts: {
          nftAttempts,
          user,
          nftMint: attemptsNftMint,
          rent: web327.SYSVAR_RENT_PUBKEY,
          systemProgram: web327.SystemProgram.programId,
          fraktNftStakeAccount: fraktNftStake
        }
      })
    );
  }
  const transaction = new web327.Transaction();
  for (let instruction of instructions)
    transaction.add(instruction);
  await sendTxn(transaction, []);
  return lotTicket.publicKey;
};

// src/loans/functions/public/getLotTicketByStaking.ts
import { web3 as web328 } from "@project-serum/anchor";
var getLotTicketByStaking = async ({
  programId,
  connection,
  user,
  liquidationLot,
  attemptsNftMint,
  fraktNftStake,
  sendTxn
}) => {
  const encoder = new TextEncoder();
  let program = returnAnchorProgram(programId, connection);
  const lotTicket = web328.Keypair.generate();
  const [nftAttempts, nftAttemptsBump] = await web328.PublicKey.findProgramAddress(
    [encoder.encode("nftattempts"), programId.toBuffer(), attemptsNftMint.toBuffer()],
    program.programId
  );
  const instructions = [];
  if (!await connection.getAccountInfo(nftAttempts, "confirmed")) {
    instructions.push(
      program.instruction.initializeNftAttemptsByStaking({
        accounts: {
          nftAttempts,
          user,
          nftMint: attemptsNftMint,
          rent: web328.SYSVAR_RENT_PUBKEY,
          systemProgram: web328.SystemProgram.programId,
          fraktNftStakeAccount: fraktNftStake
        }
      })
    );
  }
  instructions.push(
    program.instruction.getLotTicketByStaking(nftAttemptsBump, {
      accounts: {
        liquidationLot,
        nftAttempts,
        user,
        lotTicket: lotTicket.publicKey,
        attemptsNftMint,
        systemProgram: web328.SystemProgram.programId,
        fraktNftStakeAccount: fraktNftStake
      }
    })
  );
  const transaction = new web328.Transaction();
  for (let instruction of instructions)
    transaction.add(instruction);
  await sendTxn(transaction, [lotTicket]);
  return lotTicket.publicKey;
};

// src/loans/functions/public/paybackLoanWithGrace.ts
import { web3 as web329, utils as utils13 } from "@project-serum/anchor";
var paybackLoanWithGrace = async ({
  programId,
  connection,
  user,
  admin,
  liquidationLot,
  loan,
  nftMint,
  liquidityPool,
  collectionInfo,
  royaltyAddress,
  sendTxn
}) => {
  const encoder = new TextEncoder();
  const program = returnAnchorProgram(programId, connection);
  const [communityPoolsAuthority, bumpPoolsAuth] = await web329.PublicKey.findProgramAddress(
    [encoder.encode("nftlendingv2"), programId.toBuffer()],
    program.programId
  );
  const [liqOwner] = await web329.PublicKey.findProgramAddress(
    [encoder.encode("nftlendingv2"), liquidityPool.toBuffer()],
    program.programId
  );
  const nftUserTokenAccount = await findAssociatedTokenAddress(user, nftMint);
  const vaultNftTokenAccount = await findAssociatedTokenAddress(communityPoolsAuthority, nftMint);
  let instructions = [];
  const nftUserTokenAccountInfo = await connection.getAccountInfo(nftUserTokenAccount);
  if (!nftUserTokenAccountInfo)
    instructions = instructions.concat(
      createAssociatedTokenAccountInstruction(nftUserTokenAccount, user, user, nftMint)
    );
  const editionId = getMetaplexEditionPda(nftMint);
  const mainIx = program.instruction.paybackWithGrace(bumpPoolsAuth, {
    accounts: {
      loan,
      liquidityPool,
      liquidationLot,
      collectionInfo,
      user,
      admin,
      nftMint,
      nftUserTokenAccount,
      royaltyAddress,
      liqOwner,
      communityPoolsAuthority,
      vaultNftTokenAccount,
      systemProgram: web329.SystemProgram.programId,
      tokenProgram: utils13.token.TOKEN_PROGRAM_ID,
      associatedTokenProgram: utils13.token.ASSOCIATED_PROGRAM_ID,
      metadataProgram: METADATA_PROGRAM_PUBKEY,
      editionInfo: editionId
    }
  });
  instructions = instructions.concat(mainIx);
  const transaction = new web329.Transaction();
  for (let instruction of instructions)
    transaction.add(instruction);
  await sendTxn(transaction);
};

// src/loans/functions/public/paybackLoanWithGraceIx.ts
import { web3 as web330, utils as utils14 } from "@project-serum/anchor";
var paybackLoanWithGraceIx = async ({
  programId,
  connection,
  user,
  admin,
  liquidationLot,
  loan,
  nftMint,
  liquidityPool,
  collectionInfo,
  royaltyAddress
}) => {
  const encoder = new TextEncoder();
  const program = returnAnchorProgram(programId, connection);
  const [communityPoolsAuthority, bumpPoolsAuth] = await web330.PublicKey.findProgramAddress(
    [encoder.encode("nftlendingv2"), programId.toBuffer()],
    program.programId
  );
  const [liqOwner] = await web330.PublicKey.findProgramAddress(
    [encoder.encode("nftlendingv2"), liquidityPool.toBuffer()],
    program.programId
  );
  const nftUserTokenAccount = await findAssociatedTokenAddress(user, nftMint);
  const vaultNftTokenAccount = await findAssociatedTokenAddress(communityPoolsAuthority, nftMint);
  let instructions = [];
  const nftUserTokenAccountInfo = await connection.getAccountInfo(nftUserTokenAccount);
  if (!nftUserTokenAccountInfo)
    instructions = instructions.concat(
      createAssociatedTokenAccountInstruction(nftUserTokenAccount, user, user, nftMint)
    );
  const editionId = getMetaplexEditionPda(nftMint);
  const mainIx = program.instruction.paybackWithGrace(bumpPoolsAuth, {
    accounts: {
      loan,
      liquidityPool,
      liquidationLot,
      collectionInfo,
      user,
      admin,
      nftMint,
      nftUserTokenAccount,
      royaltyAddress,
      liqOwner,
      communityPoolsAuthority,
      vaultNftTokenAccount,
      systemProgram: web330.SystemProgram.programId,
      tokenProgram: utils14.token.TOKEN_PROGRAM_ID,
      associatedTokenProgram: utils14.token.ASSOCIATED_PROGRAM_ID,
      metadataProgram: METADATA_PROGRAM_PUBKEY,
      editionInfo: editionId
    }
  });
  instructions = instructions.concat(mainIx);
  return { ixs: instructions };
};

// src/loans/functions/public/stakeGemFarm.ts
import { web3 as web331, utils as utils15 } from "@project-serum/anchor";
var stakeGemFarm = async ({
  programId,
  connection,
  user,
  gemFarm,
  gemBank,
  farm,
  bank,
  feeAcc,
  nftMint,
  loan,
  isDegod,
  creatorWhitelistProof,
  sendTxn
}) => {
  const encoder = new TextEncoder();
  const program = returnAnchorProgram(programId, connection);
  const [communityPoolsAuthority, bumpPoolsAuth] = await web331.PublicKey.findProgramAddress(
    [encoder.encode("nftlendingv2"), programId.toBuffer()],
    program.programId
  );
  const [identity, bumpAuth] = await web331.PublicKey.findProgramAddress(
    [encoder.encode("degod_stake"), nftMint.toBuffer(), loan.toBuffer()],
    programId
  );
  const editionId = getMetaplexEditionPda(nftMint);
  const [farmer, bumpFarmer] = await web331.PublicKey.findProgramAddress(
    [encoder.encode("farmer"), farm.toBuffer(), identity.toBuffer()],
    gemFarm
  );
  const [lendingStake] = await web331.PublicKey.findProgramAddress(
    [encoder.encode("stake_acc"), loan.toBuffer()],
    programId
  );
  const [vault, bumpVault] = await web331.PublicKey.findProgramAddress(
    [encoder.encode("vault"), bank.toBuffer(), identity.toBuffer()],
    gemBank
  );
  const [bankAuthority, bumpAuthVaultAuthority] = await web331.PublicKey.findProgramAddress(
    [vault.toBuffer()],
    gemBank
  );
  const [gemBox, bumpGemBox] = await web331.PublicKey.findProgramAddress(
    [encoder.encode("gem_box"), vault.toBuffer(), nftMint.toBuffer()],
    gemBank
  );
  const [gemDepositReceipt, bumpGdr] = await web331.PublicKey.findProgramAddress(
    [encoder.encode("gem_deposit_receipt"), vault.toBuffer(), nftMint.toBuffer()],
    gemBank
  );
  const [gemRarity, bumpRarity] = await web331.PublicKey.findProgramAddress(
    [encoder.encode("gem_rarity"), bank.toBuffer(), nftMint.toBuffer()],
    gemBank
  );
  const [farmAuthority, bumpFarmAuth] = await web331.PublicKey.findProgramAddress(
    [farm.toBuffer()],
    gemFarm
  );
  const [gemMetadata] = await web331.PublicKey.findProgramAddress(
    [
      Buffer.from(METADATA_PREFIX),
      METADATA_PROGRAM_PUBKEY.toBuffer(),
      new web331.PublicKey(nftMint).toBuffer()
    ],
    METADATA_PROGRAM_PUBKEY
  );
  const [mintWhitelistProof] = await web331.PublicKey.findProgramAddress(
    [Buffer.from("whitelist"), bank.toBuffer(), nftMint.toBuffer()],
    gemBank
  );
  const nftUserTokenAccount = await findAssociatedTokenAddress(user, nftMint);
  const ix = program.instruction.stakeGemFarmStaking(
    {
      bumpPoolsAuth,
      bumpAuth,
      bumpFarmAuth,
      bumpAuthVaultAuthority,
      bumpRarity,
      bumpGdr,
      bumpGemBox,
      isDegod,
      bumpVault,
      bumpFarmer
    },
    {
      accounts: {
        user,
        gemFarm,
        farm,
        farmAuthority,
        lendingStake,
        farmer,
        loan,
        identity,
        bank,
        gemBank,
        feeAcc,
        vault,
        authority: bankAuthority,
        gemBox,
        gemDepositReceipt,
        gemSource: nftUserTokenAccount,
        gemMint: nftMint,
        gemRarity,
        communityPoolsAuthority,
        metadataProgram: METADATA_PROGRAM_PUBKEY,
        editionInfo: editionId,
        rent: web331.SYSVAR_RENT_PUBKEY,
        systemProgram: web331.SystemProgram.programId,
        tokenProgram: utils15.token.TOKEN_PROGRAM_ID
      },
      remainingAccounts: [
        {
          pubkey: mintWhitelistProof,
          isSigner: false,
          isWritable: false
        },
        {
          pubkey: gemMetadata,
          isSigner: false,
          isWritable: false
        },
        {
          pubkey: creatorWhitelistProof,
          isSigner: false,
          isWritable: false
        }
      ]
    }
  );
  const additionalComputeBudgetInstruction = web331.ComputeBudgetProgram.requestUnits({
    units: 4e5,
    additionalFee: 0
  });
  const transaction = new web331.Transaction().add(additionalComputeBudgetInstruction).add(ix);
  await sendTxn(transaction);
};

// src/loans/functions/public/unstakeGemFarm.ts
import { web3 as web332, utils as utils16 } from "@project-serum/anchor";
var unstakeGemFarm = async ({
  programId,
  connection,
  user,
  gemFarm,
  gemBank,
  farm,
  bank,
  feeAcc,
  nftMint,
  loan,
  isDegod,
  sendTxn
}) => {
  const encoder = new TextEncoder();
  const program = returnAnchorProgram(programId, connection);
  const [communityPoolsAuthority, bumpPoolsAuth] = await web332.PublicKey.findProgramAddress(
    [encoder.encode("nftlendingv2"), programId.toBuffer()],
    program.programId
  );
  const [identity, bumpAuth] = await web332.PublicKey.findProgramAddress(
    [encoder.encode("degod_stake"), nftMint.toBuffer(), loan.toBuffer()],
    programId
  );
  const editionId = getMetaplexEditionPda(nftMint);
  const [farmer, bumpFarmer] = await web332.PublicKey.findProgramAddress(
    [encoder.encode("farmer"), farm.toBuffer(), identity.toBuffer()],
    gemFarm
  );
  const [lendingStake] = await web332.PublicKey.findProgramAddress(
    [encoder.encode("stake_acc"), loan.toBuffer()],
    programId
  );
  const [vault, _bumpVault] = await web332.PublicKey.findProgramAddress(
    [encoder.encode("vault"), bank.toBuffer(), identity.toBuffer()],
    gemBank
  );
  const [bankAuthority, bumpAuthVaultAuthority] = await web332.PublicKey.findProgramAddress(
    [vault.toBuffer()],
    gemBank
  );
  const [gemBox, bumpGemBox] = await web332.PublicKey.findProgramAddress(
    [encoder.encode("gem_box"), vault.toBuffer(), nftMint.toBuffer()],
    gemBank
  );
  const [gemDepositReceipt, bumpGdr] = await web332.PublicKey.findProgramAddress(
    [encoder.encode("gem_deposit_receipt"), vault.toBuffer(), nftMint.toBuffer()],
    gemBank
  );
  const [gemRarity, bumpRarity] = await web332.PublicKey.findProgramAddress(
    [encoder.encode("gem_rarity"), bank.toBuffer(), nftMint.toBuffer()],
    gemBank
  );
  const [farmTreasury, bumpTreasury] = await web332.PublicKey.findProgramAddress(
    [encoder.encode("treasury"), farm.toBuffer()],
    gemFarm
  );
  const [farmAuthority, bumpAuthAuthority] = await web332.PublicKey.findProgramAddress(
    [farm.toBuffer()],
    gemFarm
  );
  const nftUserTokenAccount = await findAssociatedTokenAddress(user, nftMint);
  const additionalComputeBudgetInstruction = web332.ComputeBudgetProgram.requestUnits({
    units: 4e5,
    additionalFee: 0
  });
  const ix = program.instruction.unstakeGemFarmStaking(
    {
      bumpPoolsAuth,
      bumpAuth,
      bumpAuthVaultAuthority,
      bumpTreasury,
      bumpFarmer,
      bumpAuthAuthority,
      bumpGemBox,
      bumpGdr,
      isDegod,
      bumpRarity
    },
    {
      accounts: {
        user,
        gemFarm,
        farm,
        farmAuthority,
        farmer,
        farmTreasury,
        lendingStake,
        loan,
        identity,
        bank,
        gemBank,
        feeAcc,
        vault,
        authority: bankAuthority,
        gemBox,
        gemDepositReceipt,
        gemSource: nftUserTokenAccount,
        gemMint: nftMint,
        gemRarity,
        communityPoolsAuthority,
        metadataProgram: METADATA_PROGRAM_PUBKEY,
        editionInfo: editionId,
        rent: web332.SYSVAR_RENT_PUBKEY,
        systemProgram: web332.SystemProgram.programId,
        tokenProgram: utils16.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: utils16.token.ASSOCIATED_PROGRAM_ID
      }
    }
  );
  const transaction = new web332.Transaction().add(additionalComputeBudgetInstruction).add(ix);
  await sendTxn(transaction);
};

// src/loans/functions/public/unstakeGemFarmIx.ts
import { web3 as web333, utils as utils17 } from "@project-serum/anchor";
var unstakeGemFarmIx = async ({
  programId,
  connection,
  user,
  gemFarm,
  gemBank,
  farm,
  bank,
  feeAcc,
  nftMint,
  loan,
  isDegod
}) => {
  const encoder = new TextEncoder();
  const ixs = [];
  const program = returnAnchorProgram(programId, connection);
  const [communityPoolsAuthority, bumpPoolsAuth] = await web333.PublicKey.findProgramAddress(
    [encoder.encode("nftlendingv2"), programId.toBuffer()],
    program.programId
  );
  const [identity, bumpAuth] = await web333.PublicKey.findProgramAddress(
    [encoder.encode("degod_stake"), nftMint.toBuffer(), loan.toBuffer()],
    programId
  );
  const editionId = getMetaplexEditionPda(nftMint);
  const [farmer, bumpFarmer] = await web333.PublicKey.findProgramAddress(
    [encoder.encode("farmer"), farm.toBuffer(), identity.toBuffer()],
    gemFarm
  );
  const [lendingStake] = await web333.PublicKey.findProgramAddress(
    [encoder.encode("stake_acc"), loan.toBuffer()],
    programId
  );
  const [vault, _bumpVault] = await web333.PublicKey.findProgramAddress(
    [encoder.encode("vault"), bank.toBuffer(), identity.toBuffer()],
    gemBank
  );
  const [bankAuthority, bumpAuthVaultAuthority] = await web333.PublicKey.findProgramAddress(
    [vault.toBuffer()],
    gemBank
  );
  const [gemBox, bumpGemBox] = await web333.PublicKey.findProgramAddress(
    [encoder.encode("gem_box"), vault.toBuffer(), nftMint.toBuffer()],
    gemBank
  );
  const [gemDepositReceipt, bumpGdr] = await web333.PublicKey.findProgramAddress(
    [encoder.encode("gem_deposit_receipt"), vault.toBuffer(), nftMint.toBuffer()],
    gemBank
  );
  const [gemRarity, bumpRarity] = await web333.PublicKey.findProgramAddress(
    [encoder.encode("gem_rarity"), bank.toBuffer(), nftMint.toBuffer()],
    gemBank
  );
  const [farmTreasury, bumpTreasury] = await web333.PublicKey.findProgramAddress(
    [encoder.encode("treasury"), farm.toBuffer()],
    gemFarm
  );
  const [farmAuthority, bumpAuthAuthority] = await web333.PublicKey.findProgramAddress(
    [farm.toBuffer()],
    gemFarm
  );
  const nftUserTokenAccount = await findAssociatedTokenAddress(user, nftMint);
  const additionalComputeBudgetInstruction = web333.ComputeBudgetProgram.requestUnits({
    units: 4e5,
    additionalFee: 0
  });
  ixs.push(additionalComputeBudgetInstruction);
  const ix = program.instruction.unstakeGemFarmStaking(
    {
      bumpPoolsAuth,
      bumpAuth,
      bumpAuthVaultAuthority,
      bumpTreasury,
      bumpFarmer,
      bumpAuthAuthority,
      bumpGemBox,
      bumpGdr,
      isDegod,
      bumpRarity
    },
    {
      accounts: {
        user,
        gemFarm,
        farm,
        farmAuthority,
        farmer,
        farmTreasury,
        lendingStake,
        loan,
        identity,
        bank,
        gemBank,
        feeAcc,
        vault,
        authority: bankAuthority,
        gemBox,
        gemDepositReceipt,
        gemSource: nftUserTokenAccount,
        gemMint: nftMint,
        gemRarity,
        communityPoolsAuthority,
        metadataProgram: METADATA_PROGRAM_PUBKEY,
        editionInfo: editionId,
        rent: web333.SYSVAR_RENT_PUBKEY,
        systemProgram: web333.SystemProgram.programId,
        tokenProgram: utils17.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: utils17.token.ASSOCIATED_PROGRAM_ID
      }
    }
  );
  ixs.push(ix);
  return ixs;
};

// src/loans/functions/public/claimGemFarm.ts
import { web3 as web334, utils as utils18 } from "@project-serum/anchor";
var claimGemFarm = async ({
  programId,
  connection,
  user,
  gemFarm,
  farm,
  nftMint,
  loan,
  isDegod,
  rewardAMint,
  rewardBMint,
  sendTxn
}) => {
  const encoder = new TextEncoder();
  const program = returnAnchorProgram(programId, connection);
  const [identity, bumpAuth] = await web334.PublicKey.findProgramAddress(
    [encoder.encode("degod_stake"), nftMint.toBuffer(), loan.toBuffer()],
    programId
  );
  const [farmer, bumpFarmer] = await web334.PublicKey.findProgramAddress(
    [encoder.encode("farmer"), farm.toBuffer(), identity.toBuffer()],
    gemFarm
  );
  const [farmAuthority, bumpAuthAuthority] = await web334.PublicKey.findProgramAddress(
    [farm.toBuffer()],
    gemFarm
  );
  const [lendingStake] = await web334.PublicKey.findProgramAddress(
    [encoder.encode("stake_acc"), loan.toBuffer()],
    programId
  );
  const [rewardAPot, bumpPotA] = await web334.PublicKey.findProgramAddress(
    [encoder.encode("reward_pot"), farm.toBuffer(), rewardAMint.toBuffer()],
    gemFarm
  );
  const [rewardBPot, bumpPotB] = await web334.PublicKey.findProgramAddress(
    [encoder.encode("reward_pot"), farm.toBuffer(), rewardBMint.toBuffer()],
    gemFarm
  );
  const rewardADestinationIdentity = await findAssociatedTokenAddress(identity, rewardAMint);
  const rewardBDestinationIdentity = await findAssociatedTokenAddress(identity, rewardBMint);
  const rewardADestination = await findAssociatedTokenAddress(user, rewardAMint);
  const rewardBDestination = await findAssociatedTokenAddress(user, rewardBMint);
  const claim = program.instruction.claimGemFarmStaking(
    {
      bumpAuth,
      bumpFarmer,
      bumpAuthAuthority,
      bumpPotA,
      bumpPotB,
      isDegod
    },
    {
      accounts: {
        user,
        gemFarm,
        farm,
        farmAuthority,
        farmer,
        loan,
        identity,
        gemMint: nftMint,
        rewardADestinationIdentity,
        rewardAMint,
        rewardAPot,
        rewardBDestinationIdentity,
        rewardBMint,
        rewardBPot,
        rent: web334.SYSVAR_RENT_PUBKEY,
        systemProgram: web334.SystemProgram.programId,
        tokenProgram: utils18.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: utils18.token.ASSOCIATED_PROGRAM_ID
      }
    }
  );
  const claimed = program.instruction.getClaimedGemFarmStaking(
    bumpAuth,
    {
      accounts: {
        user,
        loan,
        identity,
        gemMint: nftMint,
        rewardADestinationIdentity,
        rewardADestination,
        rewardAMint,
        lendingStake,
        rewardBDestinationIdentity,
        rewardBDestination,
        rewardBMint,
        rent: web334.SYSVAR_RENT_PUBKEY,
        systemProgram: web334.SystemProgram.programId,
        tokenProgram: utils18.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: utils18.token.ASSOCIATED_PROGRAM_ID
      }
    }
  );
  const transaction = new web334.Transaction().add(claim).add(claimed);
  await sendTxn(transaction);
};

// src/loans/functions/public/claimGemFarmIx.ts
import { web3 as web335, utils as utils19 } from "@project-serum/anchor";
var claimGemFarmIx = async ({
  programId,
  connection,
  user,
  gemFarm,
  farm,
  nftMint,
  loan,
  isDegod,
  rewardAMint,
  rewardBMint
}) => {
  const encoder = new TextEncoder();
  const ixs = [];
  const program = returnAnchorProgram(programId, connection);
  const [identity, bumpAuth] = await web335.PublicKey.findProgramAddress(
    [encoder.encode("degod_stake"), nftMint.toBuffer(), loan.toBuffer()],
    programId
  );
  const [farmer, bumpFarmer] = await web335.PublicKey.findProgramAddress(
    [encoder.encode("farmer"), farm.toBuffer(), identity.toBuffer()],
    gemFarm
  );
  const [farmAuthority, bumpAuthAuthority] = await web335.PublicKey.findProgramAddress(
    [farm.toBuffer()],
    gemFarm
  );
  const [lendingStake] = await web335.PublicKey.findProgramAddress(
    [encoder.encode("stake_acc"), loan.toBuffer()],
    programId
  );
  const [rewardAPot, bumpPotA] = await web335.PublicKey.findProgramAddress(
    [encoder.encode("reward_pot"), farm.toBuffer(), rewardAMint.toBuffer()],
    gemFarm
  );
  const [rewardBPot, bumpPotB] = await web335.PublicKey.findProgramAddress(
    [encoder.encode("reward_pot"), farm.toBuffer(), rewardBMint.toBuffer()],
    gemFarm
  );
  const rewardADestinationIdentity = await findAssociatedTokenAddress(identity, rewardAMint);
  const rewardBDestinationIdentity = await findAssociatedTokenAddress(identity, rewardBMint);
  const rewardADestination = await findAssociatedTokenAddress(user, rewardAMint);
  const rewardBDestination = await findAssociatedTokenAddress(user, rewardBMint);
  const claim = program.instruction.claimGemFarmStaking(
    {
      bumpAuth,
      bumpFarmer,
      bumpAuthAuthority,
      bumpPotA,
      bumpPotB,
      isDegod
    },
    {
      accounts: {
        user,
        gemFarm,
        farm,
        farmAuthority,
        farmer,
        loan,
        identity,
        gemMint: nftMint,
        rewardADestinationIdentity,
        rewardAMint,
        rewardAPot,
        rewardBDestinationIdentity,
        rewardBMint,
        rewardBPot,
        rent: web335.SYSVAR_RENT_PUBKEY,
        systemProgram: web335.SystemProgram.programId,
        tokenProgram: utils19.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: utils19.token.ASSOCIATED_PROGRAM_ID
      }
    }
  );
  ixs.push(claim);
  const claimed = program.instruction.getClaimedGemFarmStaking(
    bumpAuth,
    {
      accounts: {
        user,
        loan,
        identity,
        gemMint: nftMint,
        rewardADestinationIdentity,
        rewardADestination,
        rewardAMint,
        lendingStake,
        rewardBDestinationIdentity,
        rewardBDestination,
        rewardBMint,
        rent: web335.SYSVAR_RENT_PUBKEY,
        systemProgram: web335.SystemProgram.programId,
        tokenProgram: utils19.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: utils19.token.ASSOCIATED_PROGRAM_ID
      }
    }
  );
  ixs.push(claimed);
  return ixs;
};

// src/loans/functions/public/calculateRewardDegod.ts
var calculateRewardDegod = ({
  farmer
}) => {
  if (farmer.state !== "staked") {
    return 0;
  }
  const baseRate = farmer.rewardA.fixedRate.promisedSchedule.baseRate;
  const lastTime = farmer.rewardA.fixedRate.lastUpdatedTs;
  const denominator = farmer.rewardA.fixedRate.promisedSchedule.denominator;
  const accruedReward = farmer.rewardA.accruedReward;
  const paidOutReward = farmer.rewardA.paidOutReward;
  return Math.ceil((Math.ceil(Date.now() / 1e3) - lastTime) / denominator * baseRate) + (accruedReward - paidOutReward);
};

// src/loans/functions/public/getAllFarmAccounts.ts
import { AnchorProvider as AnchorProvider2, Program as Program2 } from "@project-serum/anchor";

// src/loans/idl/idl-gem-farm.ts
var idl = {
  version: "0.0.0",
  name: "gem_farm",
  instructions: [
    {
      name: "initFarm",
      accounts: [
        {
          name: "farm",
          isMut: true,
          isSigner: true
        },
        {
          name: "farmManager",
          isMut: false,
          isSigner: true
        },
        {
          name: "farmAuthority",
          isMut: true,
          isSigner: false
        },
        {
          name: "farmTreasury",
          isMut: false,
          isSigner: false
        },
        {
          name: "rewardAPot",
          isMut: true,
          isSigner: false
        },
        {
          name: "rewardAMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "rewardBPot",
          isMut: true,
          isSigner: false
        },
        {
          name: "rewardBMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "bank",
          isMut: true,
          isSigner: true
        },
        {
          name: "gemBank",
          isMut: false,
          isSigner: false
        },
        {
          name: "payer",
          isMut: true,
          isSigner: true
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "bumpAuth",
          type: "u8"
        },
        {
          name: "bumpTreasury",
          type: "u8"
        },
        {
          name: "bumpPotA",
          type: "u8"
        },
        {
          name: "bumpPotB",
          type: "u8"
        },
        {
          name: "rewardTypeA",
          type: {
            defined: "RewardType"
          }
        },
        {
          name: "rewardTypeB",
          type: {
            defined: "RewardType"
          }
        },
        {
          name: "farmConfig",
          type: {
            defined: "FarmConfig"
          }
        }
      ]
    },
    {
      name: "updateFarm",
      accounts: [
        {
          name: "farm",
          isMut: true,
          isSigner: false
        },
        {
          name: "farmManager",
          isMut: false,
          isSigner: true
        }
      ],
      args: [
        {
          name: "config",
          type: {
            option: {
              defined: "FarmConfig"
            }
          }
        },
        {
          name: "manager",
          type: {
            option: "publicKey"
          }
        }
      ]
    },
    {
      name: "payoutFromTreasury",
      accounts: [
        {
          name: "farm",
          isMut: true,
          isSigner: false
        },
        {
          name: "farmManager",
          isMut: false,
          isSigner: true
        },
        {
          name: "farmAuthority",
          isMut: false,
          isSigner: false
        },
        {
          name: "farmTreasury",
          isMut: true,
          isSigner: false
        },
        {
          name: "destination",
          isMut: true,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "bumpAuth",
          type: "u8"
        },
        {
          name: "bumpTreasury",
          type: "u8"
        },
        {
          name: "lamports",
          type: "u64"
        }
      ]
    },
    {
      name: "addToBankWhitelist",
      accounts: [
        {
          name: "farm",
          isMut: false,
          isSigner: false
        },
        {
          name: "farmManager",
          isMut: true,
          isSigner: true
        },
        {
          name: "farmAuthority",
          isMut: false,
          isSigner: false
        },
        {
          name: "bank",
          isMut: true,
          isSigner: false
        },
        {
          name: "addressToWhitelist",
          isMut: false,
          isSigner: false
        },
        {
          name: "whitelistProof",
          isMut: true,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "gemBank",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "bumpAuth",
          type: "u8"
        },
        {
          name: "bumpWl",
          type: "u8"
        },
        {
          name: "whitelistType",
          type: "u8"
        }
      ]
    },
    {
      name: "removeFromBankWhitelist",
      accounts: [
        {
          name: "farm",
          isMut: false,
          isSigner: false
        },
        {
          name: "farmManager",
          isMut: true,
          isSigner: true
        },
        {
          name: "farmAuthority",
          isMut: true,
          isSigner: false
        },
        {
          name: "bank",
          isMut: true,
          isSigner: false
        },
        {
          name: "addressToRemove",
          isMut: false,
          isSigner: false
        },
        {
          name: "whitelistProof",
          isMut: true,
          isSigner: false
        },
        {
          name: "gemBank",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "bumpAuth",
          type: "u8"
        },
        {
          name: "bumpWl",
          type: "u8"
        }
      ]
    },
    {
      name: "initFarmer",
      accounts: [
        {
          name: "farm",
          isMut: true,
          isSigner: false
        },
        {
          name: "farmer",
          isMut: true,
          isSigner: false
        },
        {
          name: "identity",
          isMut: false,
          isSigner: true
        },
        {
          name: "bank",
          isMut: true,
          isSigner: false
        },
        {
          name: "vault",
          isMut: true,
          isSigner: false
        },
        {
          name: "gemBank",
          isMut: false,
          isSigner: false
        },
        {
          name: "payer",
          isMut: true,
          isSigner: true
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "bumpFarmer",
          type: "u8"
        },
        {
          name: "bumpVault",
          type: "u8"
        }
      ]
    },
    {
      name: "stake",
      accounts: [
        {
          name: "farm",
          isMut: true,
          isSigner: false
        },
        {
          name: "farmAuthority",
          isMut: false,
          isSigner: false
        },
        {
          name: "farmer",
          isMut: true,
          isSigner: false
        },
        {
          name: "identity",
          isMut: true,
          isSigner: true
        },
        {
          name: "bank",
          isMut: false,
          isSigner: false
        },
        {
          name: "vault",
          isMut: true,
          isSigner: false
        },
        {
          name: "gemBank",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "bumpAuth",
          type: "u8"
        },
        {
          name: "bumpFarmer",
          type: "u8"
        }
      ]
    },
    {
      name: "unstake",
      accounts: [
        {
          name: "farm",
          isMut: true,
          isSigner: false
        },
        {
          name: "farmAuthority",
          isMut: false,
          isSigner: false
        },
        {
          name: "farmTreasury",
          isMut: true,
          isSigner: false
        },
        {
          name: "farmer",
          isMut: true,
          isSigner: false
        },
        {
          name: "identity",
          isMut: true,
          isSigner: true
        },
        {
          name: "bank",
          isMut: false,
          isSigner: false
        },
        {
          name: "vault",
          isMut: true,
          isSigner: false
        },
        {
          name: "gemBank",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "bumpAuth",
          type: "u8"
        },
        {
          name: "bumpTreasury",
          type: "u8"
        },
        {
          name: "bumpFarmer",
          type: "u8"
        }
      ]
    },
    {
      name: "claim",
      accounts: [
        {
          name: "farm",
          isMut: true,
          isSigner: false
        },
        {
          name: "farmAuthority",
          isMut: false,
          isSigner: false
        },
        {
          name: "farmer",
          isMut: true,
          isSigner: false
        },
        {
          name: "identity",
          isMut: true,
          isSigner: true
        },
        {
          name: "rewardAPot",
          isMut: true,
          isSigner: false
        },
        {
          name: "rewardAMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "rewardADestination",
          isMut: true,
          isSigner: false
        },
        {
          name: "rewardBPot",
          isMut: true,
          isSigner: false
        },
        {
          name: "rewardBMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "rewardBDestination",
          isMut: true,
          isSigner: false
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "bumpAuth",
          type: "u8"
        },
        {
          name: "bumpFarmer",
          type: "u8"
        },
        {
          name: "bumpPotA",
          type: "u8"
        },
        {
          name: "bumpPotB",
          type: "u8"
        }
      ]
    },
    {
      name: "flashDeposit",
      accounts: [
        {
          name: "farm",
          isMut: true,
          isSigner: false
        },
        {
          name: "farmAuthority",
          isMut: false,
          isSigner: false
        },
        {
          name: "farmer",
          isMut: true,
          isSigner: false
        },
        {
          name: "identity",
          isMut: true,
          isSigner: true
        },
        {
          name: "bank",
          isMut: false,
          isSigner: false
        },
        {
          name: "vault",
          isMut: true,
          isSigner: false
        },
        {
          name: "vaultAuthority",
          isMut: false,
          isSigner: false
        },
        {
          name: "gemBox",
          isMut: true,
          isSigner: false
        },
        {
          name: "gemDepositReceipt",
          isMut: true,
          isSigner: false
        },
        {
          name: "gemSource",
          isMut: true,
          isSigner: false
        },
        {
          name: "gemMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false
        },
        {
          name: "gemBank",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "bumpFarmer",
          type: "u8"
        },
        {
          name: "bumpVaultAuth",
          type: "u8"
        },
        {
          name: "bumpGemBox",
          type: "u8"
        },
        {
          name: "bumpGdr",
          type: "u8"
        },
        {
          name: "amount",
          type: "u64"
        }
      ]
    },
    {
      name: "refreshFarmer",
      accounts: [
        {
          name: "farm",
          isMut: true,
          isSigner: false
        },
        {
          name: "farmer",
          isMut: true,
          isSigner: false
        },
        {
          name: "identity",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "bump",
          type: "u8"
        }
      ]
    },
    {
      name: "refreshFarmerSigned",
      accounts: [
        {
          name: "farm",
          isMut: true,
          isSigner: false
        },
        {
          name: "farmer",
          isMut: true,
          isSigner: false
        },
        {
          name: "identity",
          isMut: false,
          isSigner: true
        }
      ],
      args: [
        {
          name: "bump",
          type: "u8"
        },
        {
          name: "reenroll",
          type: "bool"
        }
      ]
    },
    {
      name: "authorizeFunder",
      accounts: [
        {
          name: "farm",
          isMut: true,
          isSigner: false
        },
        {
          name: "farmManager",
          isMut: true,
          isSigner: true
        },
        {
          name: "funderToAuthorize",
          isMut: false,
          isSigner: false
        },
        {
          name: "authorizationProof",
          isMut: true,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "bump",
          type: "u8"
        }
      ]
    },
    {
      name: "deauthorizeFunder",
      accounts: [
        {
          name: "farm",
          isMut: true,
          isSigner: false
        },
        {
          name: "farmManager",
          isMut: true,
          isSigner: true
        },
        {
          name: "funderToDeauthorize",
          isMut: false,
          isSigner: false
        },
        {
          name: "authorizationProof",
          isMut: true,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "bump",
          type: "u8"
        }
      ]
    },
    {
      name: "fundReward",
      accounts: [
        {
          name: "farm",
          isMut: true,
          isSigner: false
        },
        {
          name: "authorizationProof",
          isMut: false,
          isSigner: false
        },
        {
          name: "authorizedFunder",
          isMut: true,
          isSigner: true
        },
        {
          name: "rewardPot",
          isMut: true,
          isSigner: false
        },
        {
          name: "rewardSource",
          isMut: true,
          isSigner: false
        },
        {
          name: "rewardMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "bumpProof",
          type: "u8"
        },
        {
          name: "bumpPot",
          type: "u8"
        },
        {
          name: "variableRateConfig",
          type: {
            option: {
              defined: "VariableRateConfig"
            }
          }
        },
        {
          name: "fixedRateConfig",
          type: {
            option: {
              defined: "FixedRateConfig"
            }
          }
        }
      ]
    },
    {
      name: "cancelReward",
      accounts: [
        {
          name: "farm",
          isMut: true,
          isSigner: false
        },
        {
          name: "farmManager",
          isMut: true,
          isSigner: true
        },
        {
          name: "farmAuthority",
          isMut: false,
          isSigner: false
        },
        {
          name: "rewardPot",
          isMut: true,
          isSigner: false
        },
        {
          name: "rewardDestination",
          isMut: true,
          isSigner: false
        },
        {
          name: "rewardMint",
          isMut: false,
          isSigner: false
        },
        {
          name: "receiver",
          isMut: true,
          isSigner: false
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "bumpAuth",
          type: "u8"
        },
        {
          name: "bumpPot",
          type: "u8"
        }
      ]
    },
    {
      name: "lockReward",
      accounts: [
        {
          name: "farm",
          isMut: true,
          isSigner: false
        },
        {
          name: "farmManager",
          isMut: true,
          isSigner: true
        },
        {
          name: "rewardMint",
          isMut: false,
          isSigner: false
        }
      ],
      args: []
    },
    {
      name: "addRaritiesToBank",
      accounts: [
        {
          name: "farm",
          isMut: false,
          isSigner: false
        },
        {
          name: "farmManager",
          isMut: true,
          isSigner: true
        },
        {
          name: "farmAuthority",
          isMut: false,
          isSigner: false
        },
        {
          name: "bank",
          isMut: false,
          isSigner: false
        },
        {
          name: "gemBank",
          isMut: false,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "bumpAuth",
          type: "u8"
        },
        {
          name: "rarityConfigs",
          type: {
            vec: {
              defined: "RarityConfig"
            }
          }
        }
      ]
    }
  ],
  accounts: [
    {
      name: "authorizationProof",
      type: {
        kind: "struct",
        fields: [
          {
            name: "authorizedFunder",
            type: "publicKey"
          },
          {
            name: "farm",
            type: "publicKey"
          }
        ]
      }
    },
    {
      name: "farm",
      type: {
        kind: "struct",
        fields: [
          {
            name: "version",
            type: "u16"
          },
          {
            name: "farmManager",
            type: "publicKey"
          },
          {
            name: "farmTreasury",
            type: "publicKey"
          },
          {
            name: "farmAuthority",
            type: "publicKey"
          },
          {
            name: "farmAuthoritySeed",
            type: "publicKey"
          },
          {
            name: "farmAuthorityBumpSeed",
            type: {
              array: ["u8", 1]
            }
          },
          {
            name: "bank",
            type: "publicKey"
          },
          {
            name: "config",
            type: {
              defined: "FarmConfig"
            }
          },
          {
            name: "farmerCount",
            type: "u64"
          },
          {
            name: "stakedFarmerCount",
            type: "u64"
          },
          {
            name: "gemsStaked",
            type: "u64"
          },
          {
            name: "rarityPointsStaked",
            type: "u64"
          },
          {
            name: "authorizedFunderCount",
            type: "u64"
          },
          {
            name: "rewardA",
            type: {
              defined: "FarmReward"
            }
          },
          {
            name: "rewardB",
            type: {
              defined: "FarmReward"
            }
          }
        ]
      }
    },
    {
      name: "farmer",
      type: {
        kind: "struct",
        fields: [
          {
            name: "farm",
            type: "publicKey"
          },
          {
            name: "identity",
            type: "publicKey"
          },
          {
            name: "vault",
            type: "publicKey"
          },
          {
            name: "state",
            type: {
              defined: "FarmerState"
            }
          },
          {
            name: "gemsStaked",
            type: "u64"
          },
          {
            name: "minStakingEndsTs",
            type: "u64"
          },
          {
            name: "cooldownEndsTs",
            type: "u64"
          },
          {
            name: "rewardA",
            type: {
              defined: "FarmerReward"
            }
          },
          {
            name: "rewardB",
            type: {
              defined: "FarmerReward"
            }
          }
        ]
      }
    }
  ],
  types: [
    {
      name: "FarmConfig",
      type: {
        kind: "struct",
        fields: [
          {
            name: "minStakingPeriodSec",
            type: "u64"
          },
          {
            name: "cooldownPeriodSec",
            type: "u64"
          },
          {
            name: "unstakingFeeLamp",
            type: "u64"
          }
        ]
      }
    },
    {
      name: "FundsTracker",
      type: {
        kind: "struct",
        fields: [
          {
            name: "totalFunded",
            type: "u64"
          },
          {
            name: "totalRefunded",
            type: "u64"
          },
          {
            name: "totalAccruedToStakers",
            type: "u64"
          }
        ]
      }
    },
    {
      name: "TimeTracker",
      type: {
        kind: "struct",
        fields: [
          {
            name: "durationSec",
            type: "u64"
          },
          {
            name: "rewardEndTs",
            type: "u64"
          },
          {
            name: "lockEndTs",
            type: "u64"
          }
        ]
      }
    },
    {
      name: "FarmReward",
      type: {
        kind: "struct",
        fields: [
          {
            name: "rewardMint",
            type: "publicKey"
          },
          {
            name: "rewardPot",
            type: "publicKey"
          },
          {
            name: "rewardType",
            type: {
              defined: "RewardType"
            }
          },
          {
            name: "fixedRate",
            type: {
              defined: "FixedRateReward"
            }
          },
          {
            name: "variableRate",
            type: {
              defined: "VariableRateReward"
            }
          },
          {
            name: "funds",
            type: {
              defined: "FundsTracker"
            }
          },
          {
            name: "times",
            type: {
              defined: "TimeTracker"
            }
          }
        ]
      }
    },
    {
      name: "FarmerReward",
      type: {
        kind: "struct",
        fields: [
          {
            name: "paidOutReward",
            type: "u64"
          },
          {
            name: "accruedReward",
            type: "u64"
          },
          {
            name: "variableRate",
            type: {
              defined: "FarmerVariableRateReward"
            }
          },
          {
            name: "fixedRate",
            type: {
              defined: "FarmerFixedRateReward"
            }
          }
        ]
      }
    },
    {
      name: "FarmerVariableRateReward",
      type: {
        kind: "struct",
        fields: [
          {
            name: "lastRecordedAccruedRewardPerRarityPoint",
            type: {
              defined: "Number128"
            }
          }
        ]
      }
    },
    {
      name: "FarmerFixedRateReward",
      type: {
        kind: "struct",
        fields: [
          {
            name: "beginStakingTs",
            type: "u64"
          },
          {
            name: "beginScheduleTs",
            type: "u64"
          },
          {
            name: "lastUpdatedTs",
            type: "u64"
          },
          {
            name: "promisedSchedule",
            type: {
              defined: "FixedRateSchedule"
            }
          },
          {
            name: "promisedDuration",
            type: "u64"
          }
        ]
      }
    },
    {
      name: "TierConfig",
      type: {
        kind: "struct",
        fields: [
          {
            name: "rewardRate",
            type: "u64"
          },
          {
            name: "requiredTenure",
            type: "u64"
          }
        ]
      }
    },
    {
      name: "FixedRateSchedule",
      type: {
        kind: "struct",
        fields: [
          {
            name: "baseRate",
            type: "u64"
          },
          {
            name: "tier1",
            type: {
              option: {
                defined: "TierConfig"
              }
            }
          },
          {
            name: "tier2",
            type: {
              option: {
                defined: "TierConfig"
              }
            }
          },
          {
            name: "tier3",
            type: {
              option: {
                defined: "TierConfig"
              }
            }
          },
          {
            name: "denominator",
            type: "u64"
          }
        ]
      }
    },
    {
      name: "FixedRateConfig",
      type: {
        kind: "struct",
        fields: [
          {
            name: "schedule",
            type: {
              defined: "FixedRateSchedule"
            }
          },
          {
            name: "amount",
            type: "u64"
          },
          {
            name: "durationSec",
            type: "u64"
          }
        ]
      }
    },
    {
      name: "FixedRateReward",
      type: {
        kind: "struct",
        fields: [
          {
            name: "schedule",
            type: {
              defined: "FixedRateSchedule"
            }
          },
          {
            name: "reservedAmount",
            type: "u64"
          }
        ]
      }
    },
    {
      name: "RarityConfig",
      type: {
        kind: "struct",
        fields: [
          {
            name: "mint",
            type: "publicKey"
          },
          {
            name: "rarityPoints",
            type: "u16"
          }
        ]
      }
    },
    {
      name: "Number128",
      type: {
        kind: "struct",
        fields: [
          {
            name: "n",
            type: "u128"
          }
        ]
      }
    },
    {
      name: "VariableRateConfig",
      type: {
        kind: "struct",
        fields: [
          {
            name: "amount",
            type: "u64"
          },
          {
            name: "durationSec",
            type: "u64"
          }
        ]
      }
    },
    {
      name: "VariableRateReward",
      type: {
        kind: "struct",
        fields: [
          {
            name: "rewardRate",
            type: {
              defined: "Number128"
            }
          },
          {
            name: "rewardLastUpdatedTs",
            type: "u64"
          },
          {
            name: "accruedRewardPerRarityPoint",
            type: {
              defined: "Number128"
            }
          }
        ]
      }
    },
    {
      name: "RewardType",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Variable"
          },
          {
            name: "Fixed"
          }
        ]
      }
    },
    {
      name: "FarmerState",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Unstaked"
          },
          {
            name: "Staked"
          },
          {
            name: "PendingCooldown"
          }
        ]
      }
    },
    {
      name: "FixedRateRewardTier",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Base"
          },
          {
            name: "Tier1"
          },
          {
            name: "Tier2"
          },
          {
            name: "Tier3"
          }
        ]
      }
    }
  ]
};

// src/loans/functions/public/getAllFarmAccounts.ts
var getAllFarmAccounts = async ({
  gemFarmProgramId,
  connection
}) => {
  const anchorProgram = new Program2(
    idl,
    gemFarmProgramId,
    new AnchorProvider2(connection, createFakeWallet(), AnchorProvider2.defaultOptions())
  );
  const farmersRaw = await anchorProgram.account.farmer.all();
  return farmersRaw.map((raw) => decodedFarmer(raw.account, raw.publicKey));
};

// src/loans/functions/public/getFarmAccount.ts
import { AnchorProvider as AnchorProvider3, Program as Program3, web3 as web337 } from "@project-serum/anchor";
var getFarmAccount = async ({
  lendingStake,
  connection
}) => {
  const encoder = new TextEncoder();
  const anchorProgram = new Program3(
    idl,
    new web337.PublicKey(lendingStake.stakeContract),
    new AnchorProvider3(connection, createFakeWallet(), AnchorProvider3.defaultOptions())
  );
  const [farmer] = await web337.PublicKey.findProgramAddress(
    [
      encoder.encode("farmer"),
      new web337.PublicKey(lendingStake.dataA).toBuffer(),
      new web337.PublicKey(lendingStake.identity).toBuffer()
    ],
    new web337.PublicKey(lendingStake.stakeContract)
  );
  const farmerRaw = await anchorProgram.account.farmer.fetch(farmer);
  return decodedFarmer(farmerRaw, farmer);
};

// src/index.ts
import { AnchorProvider as AnchorProvider4, BN as BN14, web3 as web338 } from "@project-serum/anchor";
export {
  AnchorProvider4 as AnchorProvider,
  BN14 as BN,
  SOL_TOKEN,
  loans_exports as loans,
  common_exports as utils,
  web338 as web3
};
//# sourceMappingURL=index.mjs.map