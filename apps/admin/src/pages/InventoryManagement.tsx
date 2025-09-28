import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Box, AlertCircle, PlusCircle, RefreshCw } from "lucide-react";
import InventoryItemCard from "@/components/InventoryItemCard";
import {
  inventoryApi,
  InventoryItem,
  InventoryCategory,
  InventoryStatus,
  CreateInventoryItemDto,
} from "@/services/inventoryApi";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

// Category mapping for display
const categoryLabels = {
  [InventoryCategory.ELECTRONICS]: "Électronique",
  [InventoryCategory.OFFICE_SUPPLIES]: "Fournitures de bureau",
  [InventoryCategory.FURNITURE]: "Mobilier",
  [InventoryCategory.SAFETY_EQUIPMENT]: "Équipement de sécurité",
  [InventoryCategory.TOOLS]: "Outils",
  [InventoryCategory.CONSUMABLES]: "Consommables",
  [InventoryCategory.OTHER]: "Autre",
};

const categories = ["Tous", ...Object.values(InventoryCategory)];

const InventoryManagement = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const itemsPerPage = 12;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem] = useState<CreateInventoryItemDto>({
    name: "",
    description: "",
    sku: "",
    price: 0,
    quantity: 0,
    min_stock_level: 1,
    category: InventoryCategory.OTHER,
    status: InventoryStatus.ACTIVE,
    supplier: "",
    location: "",
  });

  const handleAddEquipment = async () => {
    try {
      await inventoryApi.createItem(newItem);
      toast.success("Inventory item added successfully");
      setIsAddModalOpen(false);
      fetchInventory(currentPage, selectedCategory);
      fetchLowStockItems();
      setNewItem({
        name: "",
        description: "",
        sku: "",
        price: 0,
        quantity: 0,
        min_stock_level: 1,
        category: InventoryCategory.OTHER,
        status: InventoryStatus.ACTIVE,
        supplier: "",
        location: "",
      });
    } catch (error) {
      toast.error("Erreur lors de l'ajout de l'équipement");
    }
  };
  // Fetch inventory data from backend
  const fetchInventory = async (page = 1, category?: string) => {
    try {
      setIsLoading(true);
      const categoryFilter =
        category && category !== "Tous" ? category : undefined;
      const response = await inventoryApi.getItems(
        page,
        itemsPerPage,
        categoryFilter
      );
      setInventory(response.data.items); // Add .data to access the response data
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.page);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast.error("Erreur lors du chargement de l'inventaire");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch low stock items
  const fetchLowStockItems = async () => {
    try {
      const response = await inventoryApi.getLowStockItems();
      setLowStockItems(response.data); // Add .data here too
    } catch (error) {
      console.error("Error fetching low stock items:", error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchInventory(1, selectedCategory);
    fetchLowStockItems();
  }, [selectedCategory]);

  // Filter inventory based on search term (client-side filtering for current page)
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Update item quantity
  const updateQuantity = async (id: number, newQuantity: number) => {
    try {
      const updatedItem = await inventoryApi.updateItem(id, {
        quantity: newQuantity,
      });

      // Update local state
      setInventory((prevInventory) =>
        prevInventory.map((item) =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      );

      toast.success(`Quantité de ${updatedItem.data.name} mise à jour`);

      // Check if the new quantity is below threshold and notify
      if (newQuantity < updatedItem.data.min_stock_level && newQuantity >= 0) {
        toast.warning(
          `Stock faible: ${updatedItem.data.name} (${newQuantity} restants)`,
          {
            icon: <AlertCircle className="text-yellow-500" />,
          }
        );
        // Refresh low stock items
        fetchLowStockItems();
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Erreur lors de la mise à jour de la quantité");
    }
  };

  // Refresh inventory
  const refreshInventory = async () => {
    setIsRefreshing(true);
    try {
      await fetchInventory(currentPage, selectedCategory);
      await fetchLowStockItems();
      toast.success("Inventaire mis à jour");
    } catch (error) {
      toast.error("Erreur lors de l'actualisation");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchInventory(page, selectedCategory);
  };

  // Convert backend item to card format
  const convertToCardFormat = (item: InventoryItem) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    threshold: item.min_stock_level,
    category: categoryLabels[item.category] || item.category,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-6xl mx-auto py-10 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-prosafe-700 flex items-center gap-2">
              <Box className="h-6 w-6" />
              Gestion d'Inventaire
            </h1>
            <p className="text-muted-foreground">
              Suivi et gestion de vos équipements de sécurité
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={refreshInventory}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Actualiser
            </Button>
            <Button
              className="bg-prosafe-600 hover:bg-prosafe-700"
              onClick={() => setIsAddModalOpen(true)}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Ajouter un équipement
            </Button>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un équipement</DialogTitle>
                  <DialogDescription>
                    Remplissez les informations de l'équipement à ajouter.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Nom"
                    value={newItem.name}
                    onChange={(e) =>
                      setNewItem({ ...newItem, name: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Description"
                    value={newItem.description}
                    onChange={(e) =>
                      setNewItem({ ...newItem, description: e.target.value })
                    }
                  />
                  <Input
                    placeholder="SKU"
                    value={newItem.sku}
                    onChange={(e) =>
                      setNewItem({ ...newItem, sku: e.target.value })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Prix"
                    value={newItem.price}
                    onChange={(e) =>
                      setNewItem({ ...newItem, price: Number(e.target.value) })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Quantité"
                    value={newItem.quantity}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        quantity: Number(e.target.value),
                      })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Seuil de stock minimum"
                    value={newItem.min_stock_level}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        min_stock_level: Number(e.target.value),
                      })
                    }
                  />
                  <select
                    aria-label="Catégorie"
                    title="Sélectionner une catégorie"
                    value={newItem.category}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        category: e.target.value as InventoryCategory,
                      })
                    }
                    className="w-full border rounded p-2"
                  >
                    {Object.values(InventoryCategory).map((cat) => (
                      <option key={cat} value={cat}>
                        {categoryLabels[cat]}
                      </option>
                    ))}
                  </select>
                  <Input
                    placeholder="Fournisseur"
                    value={newItem.supplier}
                    onChange={(e) =>
                      setNewItem({ ...newItem, supplier: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Emplacement"
                    value={newItem.location}
                    onChange={(e) =>
                      setNewItem({ ...newItem, location: e.target.value })
                    }
                  />
                </div>
                <DialogFooter>
                  <Button onClick={handleAddEquipment}>Ajouter</Button>
                  <DialogClose asChild>
                    <Button variant="outline">Annuler</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Low Stock Alerts */}
        {lowStockItems.length > 0 && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-yellow-800 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Alertes de stock ({lowStockItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div
                    key={`alert-${item.id}`}
                    className="text-sm flex justify-between"
                  >
                    <span>{item.name}</span>
                    <span className="font-medium text-yellow-800">
                      {item.quantity} restants (seuil: {item.min_stock_level})
                    </span>
                  </div>
                ))}
                {lowStockItems.length > 5 && (
                  <div className="text-sm text-yellow-700">
                    +{lowStockItems.length - 5} autres articles en stock faible
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Équipements de sécurité</CardTitle>
            <CardDescription>
              Gérez votre inventaire et recevez des alertes lors de ruptures de
              stock
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search and Filter Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un équipement ou SKU..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={
                      selectedCategory === category ? "default" : "outline"
                    }
                    className={
                      selectedCategory === category
                        ? "bg-prosafe-600 hover:bg-prosafe-700"
                        : ""
                    }
                    onClick={() => handleCategoryChange(category)}
                  >
                    {category === "Tous"
                      ? category
                      : categoryLabels[category as InventoryCategory] ||
                        category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="text-center py-10 text-muted-foreground">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                Chargement de l'inventaire...
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                Aucun équipement trouvé
              </div>
            ) : (
              <>
                {/* Inventory Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {filteredInventory.map((item) => (
                    <InventoryItemCard
                      key={item.id}
                      item={convertToCardFormat(item)}
                      updateQuantity={updateQuantity}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Précédent
                    </Button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          onClick={() => handlePageChange(page)}
                          className={
                            currentPage === page
                              ? "bg-prosafe-600 hover:bg-prosafe-700"
                              : ""
                          }
                        >
                          {page}
                        </Button>
                      )
                    )}

                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Suivant
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InventoryManagement;
