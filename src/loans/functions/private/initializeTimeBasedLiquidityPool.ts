import { BN, web3 } from '@project-serum/anchor';

import { returnAnchorProgram } from '../../helpers';

type InitializeTimeBasedLiquidityPool = (params: {
  programId: web3.PublicKey;
  connection: web3.Connection;
  admin: web3.PublicKey;
  rewardInterestRateTime: number | BN;
  feeInterestRateTime: number | BN;
  rewardInterestRatePrice: number | BN;
  feeInterestRatePrice: number | BN;
  id: number | BN;
  period: number | BN;
  sendTxn: (transaction: web3.Transaction, signers: web3.Keypair[]) => Promise<void>;
}) => Promise<web3.PublicKey>;

export const initializeTimeBasedLiquidityPool: InitializeTimeBasedLiquidityPool = async ({
  programId,
  connection,
  admin,
  rewardInterestRateTime,
  feeInterestRateTime,
  rewardInterestRatePrice,
  feeInterestRatePrice,
  id,
  period,
  sendTxn,
}) => {
  const encoder = new TextEncoder();
  const program = returnAnchorProgram(programId, connection);
  const liquidityPool = web3.Keypair.generate();

  const [liqOwner, liqOwnerBump] = await web3.PublicKey.findProgramAddress(
    [encoder.encode('nftlendingv2'), liquidityPool.publicKey.toBuffer()],
    program.programId,
  );

  const instruction = program.instruction.initializeTimeBasedLiquidityPool(
    liqOwnerBump,
    {
      rewardInterestRateTime: new BN(rewardInterestRateTime),
      rewardInterestRatePrice: new BN(rewardInterestRatePrice),
      feeInterestRateTime: new BN(feeInterestRateTime),
      feeInterestRatePrice: new BN(feeInterestRatePrice),
      id: new BN(id),
      period: new BN(period),
    },
    {
      accounts: {
        liquidityPool: liquidityPool.publicKey,
        liqOwner,
        admin: admin,
        rent: web3.SYSVAR_RENT_PUBKEY,
        systemProgram: web3.SystemProgram.programId,
      },
    },
  );

  const transaction = new web3.Transaction().add(instruction);

  await sendTxn(transaction, [liquidityPool]);

  return liquidityPool.publicKey;
};
