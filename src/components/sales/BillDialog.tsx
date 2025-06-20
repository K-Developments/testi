
"use client";

import type { CartItem, Customer, Sale, ChequeInfo, BankTransferInfo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AppLogo } from "@/components/AppLogo";
import { Calendar as CalendarIcon, Landmark, Printer, Wallet, AlertTriangle, Gift, Newspaper, Banknote, FileText, CreditCard, Building } from "lucide-react";
import { Label } from "@/components/ui/label";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { placeholderCustomers } from "@/lib/placeholder-data"; 
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isValid, parseISO } from "date-fns";


interface BillDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  
  cartItems?: CartItem[];
  customer?: Customer | null;
  discountPercentage?: number;
  currentSubtotal?: number;
  currentDiscountAmount?: number;
  currentTotalAmount?: number; 
  saleId?: string; 
  onConfirmSale?: (saleData: Omit<Sale, 'id' | 'saleDate' | 'staffId' | 'items'>) => void;
  offerApplied?: boolean; 

  existingSaleData?: Sale;
}

export function BillDialog({ 
  isOpen, 
  onOpenChange, 
  cartItems: newCartItems,
  customer: newCustomer,
  discountPercentage: newDiscountPercentage,
  currentSubtotal: newSubtotal,
  currentDiscountAmount: newDiscountAmount,
  currentTotalAmount: newTotalAmountDue, 
  saleId: newSaleId,
  onConfirmSale,
  offerApplied: newOfferApplied, 
  existingSaleData
}: BillDialogProps) {
  
  const isReprintMode = !!existingSaleData;
  const offerWasApplied = isReprintMode ? (existingSaleData.offerApplied || false) : (newOfferApplied || false);

  const [cashTendered, setCashTendered] = useState<string>("");
  const [chequeAmountPaid, setChequeAmountPaid] = useState<string>("");
  const [chequeNumber, setChequeNumber] = useState<string>("");
  const [chequeBank, setChequeBank] = useState<string>("");
  const [chequeDate, setChequeDate] = useState<Date | undefined>(new Date());
  
  const [bankTransferAmountPaid, setBankTransferAmountPaid] = useState<string>("");
  const [bankTransferBankName, setBankTransferBankName] = useState<string>("");
  const [bankTransferReference, setBankTransferReference] = useState<string>("");

  const [isProcessing, setIsProcessing] = useState(false);


  const transactionDate = isReprintMode && existingSaleData ? new Date(existingSaleData.saleDate) : new Date();
  const displaySaleId = isReprintMode && existingSaleData ? existingSaleData.id : (newSaleId || `SALE-${Date.now().toString().slice(-6)}`);
  
  const itemsToDisplay: CartItem[] = useMemo(() => {
    if (isReprintMode && existingSaleData) {
      return existingSaleData.items.map(item => ({
        ...item,
        name: item.name || `Product ID: ${item.id}` || "Product Name Unavailable",
        category: item.category || "Other",
        price: typeof item.price === 'number' ? item.price : 0,
        appliedPrice: typeof item.appliedPrice === 'number' ? item.appliedPrice : 0,
      }));
    }
    return newCartItems || [];
  }, [isReprintMode, existingSaleData, newCartItems]);
  
  const customerForDisplay = useMemo(() => {
    if (isReprintMode && existingSaleData) {
      if (existingSaleData.customerId) {
        return placeholderCustomers.find(c => c.id === existingSaleData.customerId) || 
               (existingSaleData.customerName ? { id: existingSaleData.customerId || '', name: existingSaleData.customerName, phone: '', shopName: '' } as Customer : null);
      }
      return existingSaleData.customerName ? { id: '', name: existingSaleData.customerName, phone: '', shopName: '' } as Customer : null;
    }
    return newCustomer;
  }, [isReprintMode, existingSaleData, newCustomer]);

  const subtotalToDisplay = (isReprintMode && existingSaleData ? existingSaleData.subTotal : newSubtotal) || 0;
  const discountPercentageToDisplay = (isReprintMode && existingSaleData ? existingSaleData.discountPercentage : newDiscountPercentage) || 0;
  const discountAmountToDisplay = (isReprintMode && existingSaleData ? existingSaleData.discountAmount : newDiscountAmount) || 0;
  const totalAmountDueForDisplay = (isReprintMode && existingSaleData ? existingSaleData.totalAmount : newTotalAmountDue) || 0;

  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
      if (isReprintMode && existingSaleData) {
        setCashTendered(existingSaleData.paidAmountCash?.toString() || "");
        setChequeAmountPaid(existingSaleData.paidAmountCheque?.toString() || "");
        setChequeNumber(existingSaleData.chequeDetails?.number || "");
        setChequeBank(existingSaleData.chequeDetails?.bank || "");
        setChequeDate(existingSaleData.chequeDetails?.date ? new Date(existingSaleData.chequeDetails.date) : new Date());
        setBankTransferAmountPaid(existingSaleData.paidAmountBankTransfer?.toString() || "");
        setBankTransferBankName(existingSaleData.bankTransferDetails?.bankName || "");
        setBankTransferReference(existingSaleData.bankTransferDetails?.referenceNumber || "");

      } else {
        setCashTendered("");
        setChequeAmountPaid("");
        setChequeNumber("");
        setChequeBank("");
        setChequeDate(new Date());
        setBankTransferAmountPaid("");
        setBankTransferBankName("");
        setBankTransferReference("");
      }
    }
  }, [isOpen, isReprintMode, existingSaleData]);

  const parsedCashTendered = parseFloat(cashTendered) || 0;
  const parsedChequeAmountPaid = parseFloat(chequeAmountPaid) || 0;
  const parsedBankTransferAmountPaid = parseFloat(bankTransferAmountPaid) || 0;

  const totalTenderedByMethods = parsedCashTendered + parsedChequeAmountPaid + parsedBankTransferAmountPaid;
  
  const changeGiven = useMemo(() => {
    if (parsedCashTendered > 0 && totalTenderedByMethods > totalAmountDueForDisplay) {
      const cashExcess = parsedCashTendered - (totalAmountDueForDisplay - (parsedChequeAmountPaid + parsedBankTransferAmountPaid));
      return Math.max(0, cashExcess);
    }
    return 0;
  }, [parsedCashTendered, parsedChequeAmountPaid, parsedBankTransferAmountPaid, totalTenderedByMethods, totalAmountDueForDisplay]);

  const totalPaymentApplied = totalTenderedByMethods - changeGiven;

  const outstandingBalance = useMemo(() => {
    return Math.max(0, totalAmountDueForDisplay - totalPaymentApplied);
  }, [totalAmountDueForDisplay, totalPaymentApplied]);


  const getPaymentSummary = useCallback(() => {
    const methodsUsed: string[] = [];
    if (parsedCashTendered > 0) methodsUsed.push("Cash");
    if (parsedChequeAmountPaid > 0) methodsUsed.push(`Cheque (${chequeNumber.trim() || 'N/A'})`);
    if (parsedBankTransferAmountPaid > 0) methodsUsed.push("Bank Transfer");

    if (outstandingBalance > 0) {
      if (methodsUsed.length === 0) return "Full Credit";
      return `Partial (${methodsUsed.join(' + ')})`;
    } else {
      if (methodsUsed.length === 0 && totalAmountDueForDisplay > 0) return "Error - No Payment"; 
      if (methodsUsed.length === 0 && totalAmountDueForDisplay === 0) return "Paid (Zero Value)";
      return methodsUsed.join(' + ');
    }
  }, [parsedCashTendered, parsedChequeAmountPaid, parsedBankTransferAmountPaid, chequeNumber, outstandingBalance, totalAmountDueForDisplay]);


  const handlePrimaryAction = async () => {
    if (isReprintMode) {
      window.print();
      onOpenChange(false); 
      return;
    }

    if (onConfirmSale) {
      setIsProcessing(true);
      if (parsedChequeAmountPaid > 0 && !chequeNumber.trim()) {
        alert("Cheque number is required if paying by cheque.");
        setIsProcessing(false);
        return;
      }
      if (parsedBankTransferAmountPaid > 0 && (!bankTransferBankName.trim() && !bankTransferReference.trim())) {
        alert("Bank Name or Reference Number is required for bank transfers.");
      }
      if (totalPaymentApplied <= 0 && totalAmountDueForDisplay > 0 && !customerForDisplay) {
        alert("A customer must be selected if the sale is on credit or partially paid with an outstanding balance.");
         setIsProcessing(false);
        return;
      }

      const saleData: Omit<Sale, 'id' | 'saleDate' | 'staffId' | 'items'> = {
        customerId: customerForDisplay?.id,
        customerName: customerForDisplay?.name,
        subTotal: subtotalToDisplay,
        discountPercentage: discountPercentageToDisplay,
        discountAmount: discountAmountToDisplay,
        totalAmount: totalAmountDueForDisplay, 
        offerApplied: offerWasApplied, 
        
        paidAmountCash: parsedCashTendered > 0 ? parsedCashTendered : undefined,
        paidAmountCheque: parsedChequeAmountPaid > 0 ? parsedChequeAmountPaid : undefined,
        chequeDetails: parsedChequeAmountPaid > 0 ? {
          number: chequeNumber.trim(),
          bank: chequeBank.trim() || undefined,
          date: chequeDate,
          amount: parsedChequeAmountPaid
        } : undefined,
        paidAmountBankTransfer: parsedBankTransferAmountPaid > 0 ? parsedBankTransferAmountPaid : undefined,
        bankTransferDetails: parsedBankTransferAmountPaid > 0 ? {
            bankName: bankTransferBankName.trim() || undefined,
            referenceNumber: bankTransferReference.trim() || undefined,
            amount: parsedBankTransferAmountPaid
        } : undefined,
        
        totalAmountPaid: totalPaymentApplied,
        outstandingBalance: outstandingBalance,
        changeGiven: changeGiven > 0 ? changeGiven : undefined,
        paymentSummary: getPaymentSummary(),
      };
      
      try {
        await onConfirmSale(saleData); 
        window.print(); 
        onOpenChange(false);
      } catch (error) {
        console.error("Error during confirm sale:", error);
      } finally {
        setIsProcessing(false);
      }
    } else {
      window.print(); 
      onOpenChange(false); 
    }
  };
  
  const isPrimaryButtonDisabled = !isReprintMode && (
    itemsToDisplay.filter(item => !item.isOfferItem || (item.isOfferItem && item.quantity > 0)).length === 0 ||
    (totalPaymentApplied <= 0 && totalAmountDueForDisplay > 0 && !customerForDisplay ) || 
    (parsedChequeAmountPaid > 0 && !chequeNumber.trim()) || 
    isProcessing
  );


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "sm:max-w-lg flex flex-col",
          "print:shadow-none print:border-none print:max-w-full print:max-h-full print:m-0 print:p-0 print:h-auto print:overflow-visible",
          isOpen ? "max-h-[90vh]" : "" 
        )}
      >
        <DialogHeader className="print:hidden px-6 pt-6">
          <DialogTitle className="font-headline text-xl">
            {isReprintMode ? "View Invoice" : "Transaction Receipt & Payment"}
          </DialogTitle>
          <DialogDescription>
            {isReprintMode ? `Details for invoice ${displaySaleId}.` : "Finalize payment and print the receipt."}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow print:overflow-visible print:flex-grow-0 print:h-auto"> 
          <div 
            id="bill-content" 
            className={cn(
                "p-6 bg-card text-card-foreground rounded-md",
                "print:p-0 print:bg-transparent print:text-black print:max-h-none print:overflow-visible"
            )}
          >
            <div className="text-center mb-6">
              <div className="flex justify-center mb-2">
                 <AppLogo size="md"/>
              </div>
              <p className="text-sm">4/1 Bujjampala, Dankotuwa</p>
              <p className="text-sm">Hotline: 077-3383721, 077-1066595</p>
            </div>

            <Separator className="my-4"/>

            <div className="text-xs mb-4">
              <p>Date: {transactionDate.toLocaleDateString()} {transactionDate.toLocaleTimeString()}</p>
              {displaySaleId && <p>Transaction ID: {displaySaleId}</p>}
              {customerForDisplay && <p>Customer: {customerForDisplay.name} {customerForDisplay.shopName ? `(${customerForDisplay.shopName})` : ''}</p>}
              <p>Served by: Staff Member</p> 
              {offerWasApplied && <p className="font-semibold text-green-600">Offer: Buy 12 Get 1 Free Applied!</p>}
            </div>

            <Separator className="my-4"/>
            
            <h3 className="font-semibold mb-2 text-sm">Order Summary:</h3>
            <div className="max-h-[150px] overflow-y-auto print:max-h-none print:overflow-visible mb-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1 font-normal">Item</th>
                    <th className="text-center py-1 font-normal">Qty</th>
                    <th className="text-right py-1 font-normal">Price</th>
                    <th className="text-right py-1 font-normal">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsToDisplay.map((item, index) => (
                    <tr key={`${item.id}-${item.saleType}-${item.isOfferItem ? 'offer' : 'paid'}-${index}`} className="border-b border-dashed">
                      <td className="py-1.5">
                        {item.name || `Product ID: ${item.id}` || "Product Name Unavailable"}
                        {item.isOfferItem && <Gift className="inline-block h-3 w-3 ml-1 text-green-600" />}
                      </td>
                      <td className="text-center py-1.5">{item.quantity}</td>
                      <td className="text-right py-1.5">{item.isOfferItem ? "FREE" : `Rs. ${item.appliedPrice.toFixed(2)}`}</td>
                      <td className="text-right py-1.5">{item.isOfferItem ? "Rs. 0.00" : `Rs. ${(item.appliedPrice * item.quantity).toFixed(2)}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1 text-xs mb-4">
              <div className="flex justify-between">
                <span>Subtotal (Paid Items):</span>
                <span>Rs. {subtotalToDisplay.toFixed(2)}</span>
              </div>
              {discountPercentageToDisplay > 0 && (
                <div className="flex justify-between">
                  <span>Discount ({discountPercentageToDisplay.toFixed(2)}%):</span>
                  <span>- Rs. {discountAmountToDisplay.toFixed(2)}</span>
                </div>
              )}
              <Separator className="my-1"/>
              <div className="flex justify-between font-bold text-lg text-primary">
                <span>TOTAL AMOUNT DUE:</span>
                <span>Rs. {totalAmountDueForDisplay.toFixed(2)}</span>
              </div>
            </div>
            
            <Separator className="my-4"/>

            {/* Payment Input Section - Hidden on Reprint */}
            {!isReprintMode && (
                <div className="mb-4 space-y-4 print:hidden">
                    <h3 className="font-semibold text-sm">Payment Details:</h3>
                    <div>
                        <Label htmlFor="cashTendered" className="text-xs">Cash Paid (Rs.)</Label>
                        <Input 
                            id="cashTendered" 
                            type="number" 
                            value={cashTendered}
                            onChange={(e) => setCashTendered(e.target.value)}
                            placeholder="0.00"
                            className="h-10 mt-1"
                            min="0"
                            step="0.01"
                            disabled={isProcessing}
                        />
                    </div>
                    <div className="border p-3 rounded-md space-y-3 bg-muted/50">
                        <p className="text-xs font-medium">Cheque Payment (Optional)</p>
                        <div>
                            <Label htmlFor="chequeAmountPaid" className="text-xs">Cheque Amount (Rs.)</Label>
                            <Input 
                                id="chequeAmountPaid" 
                                type="number" 
                                value={chequeAmountPaid}
                                onChange={(e) => setChequeAmountPaid(e.target.value)}
                                placeholder="0.00"
                                className="h-10 mt-1 bg-background"
                                min="0"
                                step="0.01"
                                disabled={isProcessing}
                            />
                        </div>
                        <div>
                            <Label htmlFor="chequeNumber" className="text-xs">Cheque Number</Label>
                            <Input 
                                id="chequeNumber" 
                                type="text" 
                                value={chequeNumber}
                                onChange={(e) => setChequeNumber(e.target.value)}
                                placeholder="Enter cheque number"
                                className="h-10 mt-1 bg-background"
                                disabled={isProcessing || parsedChequeAmountPaid <= 0}
                                required={parsedChequeAmountPaid > 0}
                            />
                        </div>
                        <div>
                            <Label htmlFor="chequeBank" className="text-xs">Cheque Bank</Label>
                            <Input 
                                id="chequeBank" 
                                type="text" 
                                value={chequeBank}
                                onChange={(e) => setChequeBank(e.target.value)}
                                placeholder="Enter bank name"
                                className="h-10 mt-1 bg-background"
                                disabled={isProcessing || parsedChequeAmountPaid <= 0}
                            />
                        </div>
                        <div>
                            <Label htmlFor="chequeDate" className="text-xs">Cheque Date</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-full justify-start text-left font-normal h-10 mt-1 bg-background",
                                    !chequeDate && "text-muted-foreground"
                                    )}
                                    disabled={isProcessing || parsedChequeAmountPaid <= 0}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {chequeDate ? format(chequeDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={chequeDate}
                                    onSelect={setChequeDate}
                                    initialFocus
                                    disabled={isProcessing || parsedChequeAmountPaid <= 0}
                                />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                     <div className="border p-3 rounded-md space-y-3 bg-muted/50">
                        <p className="text-xs font-medium">Bank Transfer (Optional)</p>
                        <div>
                            <Label htmlFor="bankTransferAmountPaid" className="text-xs">Transfer Amount (Rs.)</Label>
                            <Input 
                                id="bankTransferAmountPaid" 
                                type="number" 
                                value={bankTransferAmountPaid}
                                onChange={(e) => setBankTransferAmountPaid(e.target.value)}
                                placeholder="0.00"
                                className="h-10 mt-1 bg-background"
                                min="0"
                                step="0.01"
                                disabled={isProcessing}
                            />
                        </div>
                        <div>
                            <Label htmlFor="bankTransferBankName" className="text-xs">Bank Name</Label>
                            <Input 
                                id="bankTransferBankName" 
                                type="text" 
                                value={bankTransferBankName}
                                onChange={(e) => setBankTransferBankName(e.target.value)}
                                placeholder="Enter bank name"
                                className="h-10 mt-1 bg-background"
                                disabled={isProcessing || parsedBankTransferAmountPaid <= 0}
                            />
                        </div>
                        <div>
                            <Label htmlFor="bankTransferReference" className="text-xs">Reference Number</Label>
                            <Input 
                                id="bankTransferReference" 
                                type="text" 
                                value={bankTransferReference}
                                onChange={(e) => setBankTransferReference(e.target.value)}
                                placeholder="Enter reference number"
                                className="h-10 mt-1 bg-background"
                                disabled={isProcessing || parsedBankTransferAmountPaid <= 0}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Summary for Display (Live and Reprint) */}
            <div className="space-y-1 text-xs mb-4">
                <h4 className="font-semibold text-sm mb-1 mt-2">Payment Information:</h4>
                {(isReprintMode ? existingSaleData?.paidAmountCash : parsedCashTendered) > 0 && (
                     <div className="flex justify-between"><span>Paid by Cash:</span><span>Rs. {(isReprintMode ? existingSaleData?.paidAmountCash : parsedCashTendered)?.toFixed(2)}</span></div>
                )}
                {(isReprintMode ? existingSaleData?.paidAmountCheque : parsedChequeAmountPaid) > 0 && (
                    <>
                        <div className="flex justify-between">
                            <span>Paid by Cheque:</span>
                            <span>Rs. {(isReprintMode ? existingSaleData?.paidAmountCheque : parsedChequeAmountPaid)?.toFixed(2)}</span>
                        </div>
                        <div className="pl-4 text-muted-foreground">
                            <div>Cheque No: {isReprintMode ? existingSaleData?.chequeDetails?.number || 'N/A' : chequeNumber.trim() || 'N/A'}</div>
                            {( (isReprintMode ? existingSaleData?.chequeDetails?.bank : chequeBank.trim()) || (isReprintMode ? existingSaleData?.chequeDetails?.date : chequeDate) ) &&
                                <div>
                                    Bank: {isReprintMode ? existingSaleData?.chequeDetails?.bank || 'N/A' : chequeBank.trim() || 'N/A'}
                                    {(isReprintMode ? existingSaleData?.chequeDetails?.date : chequeDate) && isValid(isReprintMode ? new Date(existingSaleData!.chequeDetails!.date!) : (chequeDate || new Date())) &&
                                        <span> | Date: {format(isReprintMode ? new Date(existingSaleData!.chequeDetails!.date!) : (chequeDate || new Date()), "dd/MM/yy")}</span>
                                    }
                                </div>
                            }
                        </div>
                    </>
                )}
                 {(isReprintMode ? existingSaleData?.paidAmountBankTransfer : parsedBankTransferAmountPaid) > 0 && (
                    <>
                        <div className="flex justify-between">
                            <span>Paid by Bank Transfer:</span>
                            <span>Rs. {(isReprintMode ? existingSaleData?.paidAmountBankTransfer : parsedBankTransferAmountPaid)?.toFixed(2)}</span>
                        </div>
                        <div className="pl-4 text-muted-foreground">
                            <div>Ref No: {isReprintMode ? existingSaleData?.bankTransferDetails?.referenceNumber || 'N/A' : bankTransferReference.trim() || 'N/A'}</div>
                            {(isReprintMode ? existingSaleData?.bankTransferDetails?.bankName : bankTransferBankName.trim()) && 
                                <div>Bank: {isReprintMode ? existingSaleData?.bankTransferDetails?.bankName || 'N/A' : bankTransferBankName.trim() || 'N/A'}</div>
                            }
                        </div>
                    </>
                )}

                <Separator className="my-1"/>
                <div className="flex justify-between font-semibold">
                    <span>Total Tendered:</span>
                    <span>Rs. {isReprintMode ? ((existingSaleData?.paidAmountCash || 0) + (existingSaleData?.paidAmountCheque || 0) + (existingSaleData?.paidAmountBankTransfer || 0)).toFixed(2) : totalTenderedByMethods.toFixed(2)}</span>
                </div>
                
                {!isReprintMode && changeGiven > 0 && (
                    <div className="flex justify-between text-green-600">
                        <span>Change Given:</span>
                        <span>Rs. {changeGiven.toFixed(2)}</span>
                    </div>
                )}
                {isReprintMode && existingSaleData?.changeGiven && existingSaleData.changeGiven > 0 && (
                     <div className="flex justify-between text-green-600"><span>Change Given:</span><span>Rs. {existingSaleData.changeGiven.toFixed(2)}</span></div>
                )}
                
                <Separator className="my-1"/>
                <div className="flex justify-between font-bold text-sm">
                    <span>Total Payment Applied:</span>
                    <span>Rs. {isReprintMode ? (existingSaleData?.totalAmountPaid || 0).toFixed(2) : totalPaymentApplied.toFixed(2)}</span>
                </div>
                <div className={cn("flex justify-between font-bold text-sm", (isReprintMode ? (existingSaleData?.outstandingBalance || 0) : outstandingBalance) > 0 ? "text-destructive" : "text-muted-foreground")}>
                    <span>Balance Due:</span>
                    <span>Rs. {(isReprintMode ? (existingSaleData?.outstandingBalance || 0) : outstandingBalance).toFixed(2)}</span>
                </div>
                 <div className="flex justify-between text-xs text-muted-foreground pt-1">
                    <span>Payment Summary:</span>
                    <span>{isReprintMode ? existingSaleData?.paymentSummary : getPaymentSummary()}</span>
                </div>
            </div>


            <p className="text-center text-xs mt-6">Thank you for your purchase!</p>
            <p className="text-center text-xs">Please come again.</p>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-auto p-6 border-t print:hidden flex justify-end gap-2">
           <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>Cancel</Button>
           <Button onClick={handlePrimaryAction} disabled={isPrimaryButtonDisabled || isProcessing}>
             {isProcessing ? <><Banknote className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : <><Printer className="mr-2 h-4 w-4" /> {isReprintMode ? "Print Receipt" : "Confirm & Print"}</>}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    