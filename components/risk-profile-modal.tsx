"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type RiskProfileData = {
  riskTolerance: number;
  investmentGoals: string[];
  timeHorizon: string;
  experienceLevel: string;
  preferredAssets: string[];
  volatilityTolerance: number;
  incomeRequirement: boolean;
  rebalancingFrequency: string;
};

type RiskProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: RiskProfileData) => void;
};

export function RiskProfileModal({ isOpen, onClose, onComplete }: RiskProfileModalProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<RiskProfileData>({
    riskTolerance: 5,
    investmentGoals: [],
    timeHorizon: "",
    experienceLevel: "",
    preferredAssets: [],
    volatilityTolerance: 5,
    incomeRequirement: false,
    rebalancingFrequency: ""
  });

  const handleNext = () => {
    if (step === 8) {
      onComplete(data);
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step === 1) return;
    setStep(step - 1);
  };

  const updateData = <K extends keyof RiskProfileData>(key: K, value: RiskProfileData[K]) => {
    setData({ ...data, [key]: value });
  };

  const isStepComplete = () => {
    switch (step) {
      case 1:
        return true; // Risk tolerance slider always has a value
      case 2:
        return data.investmentGoals.length > 0;
      case 3:
        return !!data.timeHorizon;
      case 4:
        return !!data.experienceLevel;
      case 5:
        return data.preferredAssets.length > 0;
      case 6:
        return true; // Volatility tolerance slider always has a value
      case 7:
        return true; // Income requirement is a boolean, always valid
      case 8:
        return !!data.rebalancingFrequency;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="risk-tolerance">Risk Tolerance (1-10)</Label>
              <Slider
                id="risk-tolerance"
                min={1}
                max={10}
                step={1}
                value={[data.riskTolerance]}
                onValueChange={(value) => updateData("riskTolerance", value[0])}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Conservative</span>
                <span>Moderate</span>
                <span>Aggressive</span>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Investment Goals (Select all that apply)</Label>
              <div className="grid grid-cols-1 gap-2">
                {["Capital Preservation", "Income Generation", "Growth", "Speculation", "Hedging"].map((goal) => (
                  <div key={goal} className="flex items-center space-x-2">
                    <Checkbox
                      id={goal}
                      checked={data.investmentGoals.includes(goal)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateData("investmentGoals", [...data.investmentGoals, goal]);
                        } else {
                          updateData(
                            "investmentGoals",
                            data.investmentGoals.filter((g) => g !== goal)
                          );
                        }
                      }}
                    />
                    <Label htmlFor={goal}>{goal}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="time-horizon">Investment Time Horizon</Label>
              <Select
                value={data.timeHorizon}
                onValueChange={(value) => updateData("timeHorizon", value)}
              >
                <SelectTrigger id="time-horizon">
                  <SelectValue placeholder="Select time horizon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short Term (&lt; 1 year)</SelectItem>
                  <SelectItem value="medium">Medium Term (1-3 years)</SelectItem>
                  <SelectItem value="long">Long Term (3-10 years)</SelectItem>
                  <SelectItem value="very-long">Very Long Term (10+ years)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="experience">DeFi Experience Level</Label>
              <RadioGroup
                value={data.experienceLevel}
                onValueChange={(value) => updateData("experienceLevel", value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="beginner" id="beginner" />
                  <Label htmlFor="beginner">Beginner</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="intermediate" id="intermediate" />
                  <Label htmlFor="intermediate">Intermediate</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="advanced" id="advanced" />
                  <Label htmlFor="advanced">Advanced</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="expert" id="expert" />
                  <Label htmlFor="expert">Expert</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Preferred Asset Types (Select all that apply)</Label>
              <div className="grid grid-cols-1 gap-2">
                {["Stablecoins", "Governance Tokens", "Liquidity Pool Tokens", "Yield-bearing Assets", "NFTs"].map((asset) => (
                  <div key={asset} className="flex items-center space-x-2">
                    <Checkbox
                      id={asset}
                      checked={data.preferredAssets.includes(asset)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateData("preferredAssets", [...data.preferredAssets, asset]);
                        } else {
                          updateData(
                            "preferredAssets",
                            data.preferredAssets.filter((a) => a !== asset)
                          );
                        }
                      }}
                    />
                    <Label htmlFor={asset}>{asset}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="volatility-tolerance">Volatility Tolerance (1-10)</Label>
              <Slider
                id="volatility-tolerance"
                min={1}
                max={10}
                step={1}
                value={[data.volatilityTolerance]}
                onValueChange={(value) => updateData("volatilityTolerance", value[0])}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Income Requirement</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="income-requirement"
                  checked={data.incomeRequirement}
                  onCheckedChange={(checked) => updateData("incomeRequirement", !!checked)}
                />
                <Label htmlFor="income-requirement">I need regular income from my investments</Label>
              </div>
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rebalancing">Preferred Portfolio Rebalancing Frequency</Label>
              <Select
                value={data.rebalancingFrequency}
                onValueChange={(value) => updateData("rebalancingFrequency", value)}
              >
                <SelectTrigger id="rebalancing">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                  <SelectItem value="manual">Manual Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Risk Profile Assessment</DialogTitle>
          <DialogDescription>
            Step {step} of 8: {getStepDescription(step)}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">{renderStep()}</div>
        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
          >
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!isStepComplete()}
          >
            {step === 8 ? "Complete" : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getStepDescription(step: number): string {
  switch (step) {
    case 1:
      return "Risk Tolerance";
    case 2:
      return "Investment Goals";
    case 3:
      return "Time Horizon";
    case 4:
      return "Experience Level";
    case 5:
      return "Preferred Assets";
    case 6:
      return "Volatility Tolerance";
    case 7:
      return "Income Requirement";
    case 8:
      return "Rebalancing Frequency";
    default:
      return "";
  }
}
