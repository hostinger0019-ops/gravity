"use client";

import { useState, useEffect } from "react";

interface MortgageCalcProps {
    priceValue: number;
}

export function MortgageCalc({ priceValue }: MortgageCalcProps) {
    const [loanAmount, setLoanAmount] = useState(priceValue * 0.8); // 20% down payment
    const [interestRate, setInterestRate] = useState(8.5);
    const [loanTerm, setLoanTerm] = useState(20); // years
    const [monthlyPayment, setMonthlyPayment] = useState(0);

    useEffect(() => {
        // EMI formula: P × r × (1 + r)^n / ((1 + r)^n - 1)
        const principal = loanAmount;
        const monthlyRate = interestRate / 100 / 12;
        const numberOfPayments = loanTerm * 12;

        if (monthlyRate === 0) {
            setMonthlyPayment(principal / numberOfPayments);
        } else {
            const emi =
                (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
                (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
            setMonthlyPayment(emi);
        }
    }, [loanAmount, interestRate, loanTerm]);

    const downPayment = priceValue - loanAmount;
    const totalPayment = monthlyPayment * loanTerm * 12;
    const totalInterest = totalPayment - loanAmount;

    const formatCurrency = (amount: number) => {
        if (amount >= 10000000) {
            return `₹${(amount / 10000000).toFixed(2)}Cr`;
        } else if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(2)}L`;
        } else {
            return `₹${amount.toLocaleString("en-IN")}`;
        }
    };

    return (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 space-y-4">
            {/* Monthly Payment Display */}
            <div className="text-center p-4 bg-gradient-to-r from-emerald-900/30 to-teal-900/30 rounded-lg border border-emerald-700/30">
                <div className="text-sm text-gray-400 mb-1">Estimated Monthly Payment</div>
                <div className="text-2xl font-bold text-emerald-400">
                    {formatCurrency(monthlyPayment)}
                    <span className="text-sm text-gray-400">/month</span>
                </div>
            </div>

            {/* Loan Amount Slider */}
            <div>
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Loan Amount</span>
                    <span className="text-white font-semibold">{formatCurrency(loanAmount)}</span>
                </div>
                <input
                    type="range"
                    min={priceValue * 0.5}
                    max={priceValue * 0.9}
                    step={100000}
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>50%</span>
                    <span>90%</span>
                </div>
            </div>

            {/* Interest Rate Slider */}
            <div>
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Interest Rate</span>
                    <span className="text-white font-semibold">{interestRate}% p.a.</span>
                </div>
                <input
                    type="range"
                    min={6}
                    max={12}
                    step={0.1}
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>6%</span>
                    <span>12%</span>
                </div>
            </div>

            {/* Loan Term Slider */}
            <div>
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Loan Term</span>
                    <span className="text-white font-semibold">{loanTerm} years</span>
                </div>
                <input
                    type="range"
                    min={5}
                    max={30}
                    step={1}
                    value={loanTerm}
                    onChange={(e) => setLoanTerm(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>5 years</span>
                    <span>30 years</span>
                </div>
            </div>

            {/* Summary */}
            <div className="pt-3 border-t border-zinc-700 space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-400">Property Price</span>
                    <span className="text-white font-semibold">{formatCurrency(priceValue)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-400">Down Payment ({((downPayment / priceValue) * 100).toFixed(0)}%)</span>
                    <span className="text-white font-semibold">{formatCurrency(downPayment)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-400">Total Interest</span>
                    <span className="text-orange-400 font-semibold">{formatCurrency(totalInterest)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-zinc-700">
                    <span className="text-gray-300 font-semibold">Total Payment</span>
                    <span className="text-emerald-400 font-bold">{formatCurrency(totalPayment)}</span>
                </div>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-gray-500 text-center pt-2">
                *This is an estimate. Actual rates may vary based on lender terms.
            </p>
        </div>
    );
}
