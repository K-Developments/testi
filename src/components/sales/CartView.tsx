
"use client";

import * as React from "react";
import type { CartItem, Customer } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MinusCircle, PlusCircle, Trash2, Users, XCircle, Check, ChevronsUpDown, ShoppingCart, Loader2, AlertTriangle, Gift } from "lucide-react";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useCustomers } from "@/hooks/useCustomers";

interface CartViewProps {
  cartItems: CartItem[];
  selectedCustomer: Customer | null;
  discountPercentage: number;
  onUpdateQuantity: (productId: string, quantity: number, saleType: 'retail' | 'wholesale') => void;
  onRemoveItem: (productId: string, saleType: 'retail' | 'wholesale') => void;
  onSelectCustomer: (customer: Customer | null) => void; 
  onUpdateDiscountPercentage: (percentage: number) => void;
  onCheckout: () => void;
  onCancelOrder: () => void;
  className?: string;
}

export function CartView({
  cartItems,
  selectedCustomer,
  discountPercentage,
  onUpdateQuantity,
  onRemoveItem,
  onSelectCustomer,
  onUpdateDiscountPercentage,
  onCheckout,
  onCancelOrder,
  className
}: CartViewProps) {
  const { customers: allCustomers, isLoading: isLoadingCustomers, error: customersError } = useCustomers();
  
  // Subtotal should only consider non-offer items
  const subtotal = cartItems.filter(item => !item.isOfferItem).reduce((sum, item) => sum + item.appliedPrice * item.quantity, 0);
  
  const [openCustomerPopover, setOpenCustomerPopover] = React.useState(false);

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newPercentage = parseFloat(e.target.value) || 0;
    newPercentage = Math.max(0, Math.min(newPercentage, 100));
    onUpdateDiscountPercentage(newPercentage);
  };

  const calculatedDiscountAmount = subtotal * (discountPercentage / 100);
  const totalAmount = Math.max(0, subtotal - calculatedDiscountAmount); // Total amount is based on subtotal of paid items

  const customerOptions = React.useMemo(() => {
    const options = [{ value: "guest", label: "Walk-in / Guest", customerObject: null as Customer | null }];
    if (allCustomers) {
      allCustomers.forEach(customer => {
        options.push({
          value: customer.id,
          label: `${customer.name} (${customer.phone || 'N/A'})${customer.shopName ? ` - ${customer.shopName}` : ''}`,
          customerObject: customer
        });
      });
    }
    return options;
  }, [allCustomers]);

  const currentCustomerLabel = selectedCustomer
    ? `${selectedCustomer.name} (${selectedCustomer.phone || 'N/A'})${selectedCustomer.shopName ? ` - ${selectedCustomer.shopName}` : ''}`
    : "Walk-in / Guest";

  return (
    <Card className={cn("rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col h-full overflow-hidden", className)}>
      <CardHeader className="p-4 border-b">
        <CardTitle className="font-semibold tracking-tight font-headline text-lg">Current Order</CardTitle>
        <div className="flex items-center gap-2 pt-2">
          <Users className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <Popover open={openCustomerPopover} onOpenChange={setOpenCustomerPopover}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCustomerPopover}
                className="w-full justify-between flex-1 h-9 text-sm"
                disabled={isLoadingCustomers || !!customersError}
              >
                <span className="truncate">
                  {isLoadingCustomers ? "Loading customers..." : customersError ? "Error loading" : (currentCustomerLabel || "Select Customer...")}
                </span>
                {isLoadingCustomers ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command
                 filter={(value, search) => {
                  const option = customerOptions.find(opt => opt.value === value);
                  if (!option) return 0;
                  const label = typeof option.label === 'string' ? option.label.toLowerCase() : '';
                  const name = option.customerObject?.name ? option.customerObject.name.toLowerCase() : '';
                  const shopName = option.customerObject?.shopName ? option.customerObject.shopName.toLowerCase() : '';
                  const searchableString = `${label} ${name} ${shopName}`;
                  return searchableString.includes(search.toLowerCase()) ? 1 : 0;
                }}
              >
                <CommandInput placeholder="Search customer..." className="h-9"/>
                {isLoadingCustomers && <div className="p-2 text-center text-sm text-muted-foreground">Loading...</div>}
                {customersError && <div className="p-2 text-center text-sm text-destructive flex items-center justify-center gap-1"><AlertTriangle className="h-4 w-4" /> Error</div>}
                {!isLoadingCustomers && !customersError && (
                  <CommandList>
                    <CommandEmpty>No customer found.</CommandEmpty>
                    <CommandGroup>
                      {customerOptions.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value} 
                          onSelect={() => {
                            onSelectCustomer(option.customerObject); 
                            setOpenCustomerPopover(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              (selectedCustomer?.id === option.value && option.value !== "guest") || (!selectedCustomer && option.value === "guest")
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {option.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                )}
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow p-0 overflow-hidden">
        <ScrollArea className="h-full">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Your cart is empty.</p>
              <p className="text-xs text-muted-foreground mt-0.5">Add products from the list to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {cartItems.map((item, index) => (
                <div key={`${item.id}-${item.saleType}-${item.isOfferItem ? 'offer' : 'paid'}-${index}`} className="flex items-start p-3 gap-3">
                  <Image
                    src={item.imageUrl || "https://placehold.co/48x48.png"}
                    alt={item.name}
                    width={48}
                    height={48}
                    className="rounded-md aspect-square object-cover flex-shrink-0 mt-0.5"
                    data-ai-hint={`${item.category.toLowerCase()} product`}
                  />
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-grow min-w-0 pr-2">
                        <p className="text-sm font-medium truncate" title={item.name}>
                          {item.name}
                          {item.isOfferItem && <Gift className="inline-block h-4 w-4 ml-1 text-green-600" />}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.isOfferItem ? <span className="font-semibold text-green-600">FREE</span> : `Rs. ${item.appliedPrice.toFixed(2)}`}
                          {item.saleType === 'wholesale' && !item.isOfferItem && <span className="text-blue-500 ml-1 font-semibold">(W)</span>}
                        </p>
                      </div>
                      {!item.isOfferItem && ( // Allow removing only paid items directly, offer items are auto-managed
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-full -mr-1 -mt-0.5 flex-shrink-0" onClick={() => onRemoveItem(item.id, item.saleType)}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove {item.name}</span>
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1.5 gap-2">
                      {!item.isOfferItem ? (
                        <div className="flex items-center space-x-1.5">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1, item.saleType)}
                            disabled={item.quantity <= 1}
                          >
                            <MinusCircle className="h-3.5 w-3.5" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 1, item.saleType)}
                            className="h-7 w-10 text-center px-1 text-sm"
                            min="1"
                            max={item.stock} // Assuming 'stock' is available on CartItem, might need to fetch from Product
                            aria-label={`Quantity for ${item.name}`}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1, item.saleType)}
                            disabled={item.quantity >= (allCustomers.find(p=>p.id === item.id)?.stock || item.stock || 0)} // Assuming 'stock' is available
                          >
                            <PlusCircle className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">Qty: {item.quantity}</div>
                      )}
                       <p className="text-sm font-semibold text-right">
                        {item.isOfferItem ? <span className="text-green-600">Rs. 0.00</span> : `Rs. ${(item.appliedPrice * item.quantity).toFixed(2)}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      
      {cartItems.length > 0 && (
        <CardFooter className="flex flex-col gap-2.5 p-4 border-t">
          <div className="w-full flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Subtotal:</span>
            <span>Rs. {subtotal.toFixed(2)}</span>
          </div>
          <div className="w-full flex items-center justify-between text-sm">
            <Label htmlFor="discountPercentage" className="text-sm text-muted-foreground shrink-0">Discount (%):</Label>
            <Input
              id="discountPercentage"
              type="number"
              value={discountPercentage.toString()}
              onChange={handleDiscountChange}
              className="h-8 w-20 text-sm text-right ml-2"
              placeholder="0"
              min="0"
              max="100"
              step="0.01"
            />
          </div>
          {discountPercentage > 0 && (
            <div className="w-full flex justify-between text-sm text-muted-foreground">
                <span>Discount Amount:</span>
                <span>- Rs. {calculatedDiscountAmount.toFixed(2)}</span>
            </div>
          )}
          <Separator className="my-1" />
          <div className="w-full flex justify-between text-base font-bold">
            <span>Total:</span>
            <span>Rs. {totalAmount.toFixed(2)}</span>
          </div>
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1.5">
            <Button
              variant="outline"
              size="lg" 
              className="py-2.5"
              onClick={onCancelOrder}
            >
              <XCircle className="mr-1.5 h-4.5 w-4.5" />
              Cancel
            </Button>
            <Button
              size="lg" 
              className="py-2.5"
              onClick={onCheckout}
              disabled={cartItems.filter(item => !item.isOfferItem).length === 0} // Disable if only free items or empty
            >
              Checkout
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
