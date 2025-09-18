import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MinusCircle, PlusCircle, AlertTriangle } from "lucide-react";

interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  threshold: number;
  category: string;
}

interface InventoryItemCardProps {
  item: InventoryItem;
  updateQuantity: (id: number, newQuantity: number) => void;
}

const InventoryItemCard = ({
  item,
  updateQuantity,
}: InventoryItemCardProps) => {
  const [quantityInput, setQuantityInput] = useState(item.quantity.toString());
  const [isEditing, setIsEditing] = useState(false);

  const isLowStock = item.quantity < item.threshold;

  const handleIncrement = () => {
    const newQuantity = item.quantity + 1;
    updateQuantity(item.id, newQuantity);
    setQuantityInput(newQuantity.toString());
  };

  const handleDecrement = () => {
    if (item.quantity > 0) {
      const newQuantity = item.quantity - 1;
      updateQuantity(item.id, newQuantity);
      setQuantityInput(newQuantity.toString());
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuantityInput(e.target.value);
  };

  const handleQuantityBlur = () => {
    const newQuantity = parseInt(quantityInput);
    if (!isNaN(newQuantity) && newQuantity >= 0) {
      updateQuantity(item.id, newQuantity);
    } else {
      // Reset to original value if invalid input
      setQuantityInput(item.quantity.toString());
    }
    setIsEditing(false);
  };

  const handleQuantityFocus = () => {
    setIsEditing(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleQuantityBlur();
    }
  };

  return (
    <Card
      className={`border ${isLowStock ? "border-yellow-300 bg-yellow-50" : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-lg">{item.name}</h3>
            <p className="text-sm text-muted-foreground">{item.category}</p>
          </div>
          {isLowStock && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Quantité:</span>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleDecrement}
              >
                <MinusCircle className="h-4 w-4" />
              </Button>

              <Input
                type="text"
                value={quantityInput}
                onChange={handleQuantityChange}
                onBlur={handleQuantityBlur}
                onFocus={handleQuantityFocus}
                onKeyDown={handleKeyDown}
                className="w-14 h-8 text-center"
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleIncrement}
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm">Seuil d'alerte:</span>
            <span className="text-sm font-medium">{item.threshold} unités</span>
          </div>

          {isLowStock && (
            <p className="mt-3 text-xs text-yellow-700 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Stock faible, réapprovisionnement nécessaire
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InventoryItemCard;
