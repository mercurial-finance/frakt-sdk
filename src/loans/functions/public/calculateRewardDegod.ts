import  { FarmerView } from '../../types';

type CalculationRewardDegod = (params: {farmer: FarmerView}) => number;

export const calculateRewardDegod: CalculationRewardDegod = ({
    farmer
}) => {   
  if (farmer.state !== 'staked') {
    return 0;
  }

  const baseRate = farmer.rewardA.fixedRate.promisedSchedule.baseRate;
  const lastTime = farmer.rewardA.fixedRate.lastUpdatedTs;
  const denominator = farmer.rewardA.fixedRate.promisedSchedule.denominator;
  const accruedReward = farmer.rewardA.accruedReward;
  const paidOutReward = farmer.rewardA.paidOutReward;
  return Math.ceil((Math.ceil(Date.now() / 1e3) - lastTime) / denominator * baseRate) + (accruedReward - paidOutReward);
};