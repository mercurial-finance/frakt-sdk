import anchor from '@project-serum/anchor';
import { PublicKey, Transaction } from '@solana/web3.js';

import { returnAnchorProgram } from '../../contract_model/accounts';

const harvestLiquidity = async (
  programId: PublicKey,
  provider: anchor.Provider,
  liquidityPool: PublicKey,
  user: PublicKey,
  sendTxn: (transaction: Transaction) => Promise<void>
): Promise<any> => {
  const encoder = new TextEncoder();
  const program = await returnAnchorProgram(programId, provider);

  const [liqOwner] = await anchor.web3.PublicKey.findProgramAddress(
    [encoder.encode('nftlendingv2'), liquidityPool.toBuffer()],
    program.programId,
  );

  const [deposit, depositBump] = await anchor.web3.PublicKey.findProgramAddress(
    [encoder.encode('deposit'), liquidityPool.toBuffer(), user.toBuffer()],
    program.programId,
  );

  const instruction = program.instruction.harvestLiquidity(depositBump, {
    accounts: {
      liquidityPool,
      user,
      deposit,
      liqOwner,
      systemProgram: anchor.web3.SystemProgram.programId,
    },
  });

  const transaction = new Transaction().add(instruction);

  await sendTxn(transaction);
};

export default harvestLiquidity;
