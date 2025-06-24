
"use client";

import React from 'react';
import { AppLogo } from "@/components/AppLogo";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Printer } from "lucide-react";
import type { Sale, CartItem } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Cast returned items to include returnQuantity
interface ReturnedItemForReceipt extends CartItem {
  returnQuantity: number;
}

interface ReturnInvoiceProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  originalSale: Sale | null;
  returnedItems: ReturnedItemForReceipt[];
  exchangedItems: CartItem[];
  returnId: string | null;
}

const formatCurrency = (amount: number) => `Rs. ${amount.toFixed(2)}`;

export function ReturnInvoiceDialog({ isOpen, onOpenChange, originalSale, returnedItems, exchangedItems, returnId }: ReturnInvoiceProps) {
  if (!originalSale) return null;

  const returnTotalValue = returnedItems.reduce((total, item) => {
      return total + (item.appliedPrice * item.returnQuantity);
  }, 0);

  const exchangeTotalValue = exchangedItems.reduce((total, item) => {
      return total + (item.appliedPrice * item.quantity);
  }, 0);

  const difference = exchangeTotalValue - returnTotalValue;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-lg flex flex-col", "print:shadow-none print:border-none print:max-w-full print:max-h-none print:m-0 print:p-0 print:h-auto print:overflow-visible", isOpen ? "max-h-[90vh]" : "")}>
        <DialogHeader className="print:hidden px-6 pt-6">
          <DialogTitle className="font-headline text-xl">Return & Exchange Receipt</DialogTitle>
          <DialogDescription>
            A summary of the return transaction. Print this for the customer.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow print:overflow-visible print:max-h-none print:h-auto">
          <div id="return-receipt-content" className="p-6 bg-card text-card-foreground rounded-md print:p-4 print:bg-transparent print:text-black print:max-h-none print:overflow-visible">
              <div className="text-center mb-6">
                <div className="flex justify-center mb-2">
                  <AppLogo size="md"/>
                </div>
                <p className="text-sm">4/1 Bujjampala, Dankotuwa</p>
                <p className="text-sm">Hotline: 077-3383721, 077-1066595</p>
              </div>

              <Separator className="my-4"/>
              
              <div className="text-xs mb-4">
                <p><strong>Return ID:</strong> <span className="font-mono">{returnId || 'N/A'}</span></p>
                <p><strong>Return Date:</strong> {format(new Date(), "PP, p")}</p>
                <p><strong>Original Sale ID:</strong> {originalSale.id}</p>
                <p><strong>Customer:</strong> {originalSale.customerName || "N/A"}</p>
              </div>
              <Separator className="my-4"/>

              {/* Returned Items */}
              {returnedItems.length > 0 && (
                <>
                  <h3 className="font-semibold mb-2 text-sm">Returned Items:</h3>
                  <table className="w-full text-xs print:w-full">
                    <thead><tr className="border-b"><th className="text-left py-1 font-normal w-[50%]">Item</th><th className="text-center py-1 font-normal">Qty</th><th className="text-right py-1 font-normal">Credit Each</th><th className="text-right py-1 font-normal">Total Credit</th></tr></thead>
                    <tbody>
                      {returnedItems.map(item => (
                        <tr key={item.id} className="border-b border-dashed">
                          <td className="py-1.5 break-words">{item.name}</td>
                          <td className="text-center py-1.5">{item.returnQuantity}</td>
                          <td className="text-right py-1.5">{formatCurrency(item.appliedPrice)}</td>
                          <td className="text-right py-1.5 font-semibold">{formatCurrency(item.appliedPrice * item.returnQuantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-end mt-2 font-bold text-sm">
                    <span>Total Return Credit:</span>
                    <span className="ml-4">{formatCurrency(returnTotalValue)}</span>
                  </div>
                  <Separator className="my-4"/>
                </>
              )}
              
              {/* Exchanged Items */}
              {exchangedItems.length > 0 && (
                 <>
                  <h3 className="font-semibold mb-2 text-sm">New Items (Exchange):</h3>
                  <table className="w-full text-xs print:w-full">
                    <thead><tr className="border-b"><th className="text-left py-1 font-normal w-[50%]">Item</th><th className="text-center py-1 font-normal">Qty</th><th className="text-right py-1 font-normal">Price Each</th><th className="text-right py-1 font-normal">Total Cost</th></tr></thead>
                    <tbody>
                      {exchangedItems.map(item => (
                        <tr key={item.id} className="border-b border-dashed">
                          <td className="py-1.5 break-words">{item.name}</td>
                          <td className="text-center py-1.5">{item.quantity}</td>
                          <td className="text-right py-1.5">{formatCurrency(item.appliedPrice)}</td>
                          <td className="text-right py-1.5 font-semibold">{formatCurrency(item.appliedPrice * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                   <div className="flex justify-end mt-2 font-bold text-sm">
                    <span>Total New Items Cost:</span>
                    <span className="ml-4">{formatCurrency(exchangeTotalValue)}</span>
                  </div>
                  <Separator className="my-4"/>
                </>
              )}
              
              {/* Summary */}
              <div className={cn(
                "flex justify-end text-lg font-bold",
                 difference >= 0 ? "text-destructive" : "text-green-600"
              )}>
                 <span>{difference >= 0 ? 'Amount to Pay:' : 'Credit Due:'}</span>
                 <span className="ml-4">{formatCurrency(Math.abs(difference))}</span>
              </div>
              
              <p className="text-center text-xs mt-6">Thank you!</p>
          </div>
        </ScrollArea>
        <DialogFooter className="mt-auto p-6 border-t print:hidden flex justify-end gap-2">
           <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
           <Button onClick={handlePrint}>
             <Printer className="mr-2 h-4 w-4" /> Print Receipt
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
