import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Box,
  Package,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Filter,
  Search,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  inventoryApi,
  InventoryItem,
  InventoryResponse,
  CreateInventoryItemDto,
  InventoryCategory,
  InventoryStatus,
} from "@/services/inventoryApi";
import { useAuth } from "@/contexts/AuthContext";

const InventoryManagement: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<string>("all-categories");
  const [statusFilter, setStatusFilter] = useState<string>("all-status");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Form state for creating/editing items
  const [formData, setFormData] = useState<CreateInventoryItemDto>({
    name: "",
    description: "",
    sku: "",
    price: 0,
    quantity: 0,
    min_stock_level: 0,
    category: InventoryCategory.OTHER,
    status: InventoryStatus.ACTIVE,
    supplier: "",
    location: "",
  });

  const fetchItems = async () => {
    try {
      setLoading(true);
      // Fetch all items without backend filtering to enable proper frontend filtering
      const response = await inventoryApi.getItems(page, 10);
      setItems(response.data.items);
      setTotalPages(response.data.totalPages);
      setTotal(response.data.total);
    } catch (error) {
      console.error("Error fetching inventory items:", error);
      toast({
        title: "Error",
        description: "Failed to load inventory items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshItems = async () => {
    try {
      setRefreshing(true);
      await fetchItems();
      toast({
        title: "Success",
        description: "Inventory refreshed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh inventory",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [page]);

  const handleCreate = async () => {
    try {
      await inventoryApi.createItem(formData);
      toast({
        title: "Success",
        description: "Item created successfully",
      });
      setIsCreateDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        sku: "",
        price: 0,
        quantity: 0,
        min_stock_level: 0,
        category: InventoryCategory.OTHER,
        supplier: "",
        location: "",
      });
      fetchItems();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create item",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingItem) return;

    try {
      await inventoryApi.updateItem(editingItem.id, formData);
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingItem(null);
      fetchItems();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      await inventoryApi.deleteItem(id);
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
      fetchItems();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      sku: item.sku,
      price: item.price,
      quantity: item.quantity,
      min_stock_level: item.min_stock_level,
      category: InventoryCategory[item.category],
      supplier: item.supplier || "",
      location: item.location || "",
    });
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: "bg-green-500", label: "Active" },
      inactive: { color: "bg-gray-500", label: "Inactive" },
      out_of_stock: { color: "bg-red-500", label: "Out of Stock" },
      low_stock: { color: "bg-yellow-500", label: "Low Stock" },
      discontinued: { color: "bg-red-700", label: "Discontinued" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return (
      <Badge className={`${config.color} text-white`}>{config.label}</Badge>
    );
  };

  const getCategoryLabel = (category: string) => {
    const categories = {
      all: "All",
      electronics: "Electronics",
      office_supplies: "Office Supplies",
      furniture: "Furniture",
      safety_equipment: "Safety Equipment",
      tools: "Tools",
      consumables: "Consumables",
      other: "Other",
    };
    return categories[category as keyof typeof categories] || category;
  };
  // Enhanced filtering function that combines search, category, and status filters
  const filteredItems = items.filter((item) => {
    // Search filter - check name, SKU, and description
    const matchesSearch =
      searchTerm === "" ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(searchTerm.toLowerCase()));

    // Category filter
    const matchesCategory =
      categoryFilter === "all-categories" || item.category === categoryFilter;

    // Status filter
    const matchesStatus = statusFilter === "all-status" || item.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Box className="h-6 w-6" />
          Inventory Management
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={refreshItems}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Inventory Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Item name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
                <Input
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
                <Input
                  placeholder="SKU"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                />
                <Input
                  type="number"
                  placeholder="Price"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <Input
                  type="number"
                  placeholder="Quantity"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <Input
                  type="number"
                  placeholder="Min stock level"
                  value={formData.min_stock_level}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      min_stock_level: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      category: value as InventoryCategory,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="office_supplies">
                      Office Supplies
                    </SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="safety_equipment">
                      Safety Equipment
                    </SelectItem>
                    <SelectItem value="tools">Tools</SelectItem>
                    <SelectItem value="consumables">Consumables</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleCreate} className="w-full">
                  Create Item
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, SKU, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-categories">All Categories</SelectItem>
                  <SelectItem value={InventoryCategory.ELECTRONICS}>
                    Electronics
                  </SelectItem>
                  <SelectItem value={InventoryCategory.OFFICE_SUPPLIES}>
                    Office Supplies
                  </SelectItem>
                  <SelectItem value={InventoryCategory.FURNITURE}>
                    Furniture
                  </SelectItem>
                  <SelectItem value={InventoryCategory.SAFETY_EQUIPMENT}>
                    Safety Equipment
                  </SelectItem>
                  <SelectItem value={InventoryCategory.TOOLS}>Tools</SelectItem>
                  <SelectItem value={InventoryCategory.CONSUMABLES}>
                    Consumables
                  </SelectItem>
                  <SelectItem value={InventoryCategory.OTHER}>Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-status">All Status</SelectItem>
                  <SelectItem value={InventoryStatus.ACTIVE}>Active</SelectItem>
                  <SelectItem value={InventoryStatus.INACTIVE}>
                    Inactive
                  </SelectItem>
                  <SelectItem value={InventoryStatus.LOW_STOCK}>
                    Low Stock
                  </SelectItem>
                  <SelectItem value={InventoryStatus.OUT_OF_STOCK}>
                    Out of Stock
                  </SelectItem>
                  <SelectItem value={InventoryStatus.DISCONTINUED}>
                    Discontinued
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Inventory Items ({total} total, {filteredItems.length} shown)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Name</TableHead>
                    <TableHead className="min-w-[100px]">SKU</TableHead>
                    <TableHead className="min-w-[120px]">Category</TableHead>
                    <TableHead className="min-w-[80px]">Quantity</TableHead>
                    <TableHead className="min-w-[80px]">Price</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.sku}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getCategoryLabel(item.category)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.quantity}</span>
                          {item.quantity <= item.min_stock_level && (
                            <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${item.price.toFixed(2)}
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {user?.roles?.includes("admin") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="w-full sm:w-auto"
        >
          Previous
        </Button>
        <span className="flex items-center px-4 text-sm">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="w-full sm:w-auto"
        >
          Next
        </Button>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Item name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            <Input
              placeholder="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
            <Input
              placeholder="SKU"
              value={formData.sku}
              onChange={(e) =>
                setFormData({ ...formData, sku: e.target.value })
              }
            />
            <Input
              type="number"
              placeholder="Price"
              value={formData.price}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  price: parseFloat(e.target.value) || 0,
                })
              }
            />
            <Input
              type="number"
              placeholder="Quantity"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  quantity: parseInt(e.target.value) || 0,
                })
              }
            />
            <Input
              type="number"
              placeholder="Min stock level"
              value={formData.min_stock_level}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  min_stock_level: parseInt(e.target.value) || 0,
                })
              }
            />
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  category: value as InventoryCategory,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="office_supplies">Office Supplies</SelectItem>
                <SelectItem value="furniture">Furniture</SelectItem>
                <SelectItem value="safety_equipment">
                  Safety Equipment
                </SelectItem>
                <SelectItem value="tools">Tools</SelectItem>
                <SelectItem value="consumables">Consumables</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleUpdate} className="w-full">
              Update Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryManagement;
