import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, UtensilsCrossed, Image } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { MenuItem, Category, CreateMenuItemInput, UpdateMenuItemInput, DietaryLabel } from '../../../server/src/schema';

const DIETARY_LABELS: DietaryLabel[] = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'nut-free',
  'keto',
  'low-carb',
  'halal',
  'kosher',
  'spicy',
  'organic'
];

const DIETARY_LABEL_EMOJIS: Record<DietaryLabel, string> = {
  vegetarian: '🥬',
  vegan: '🌱',
  'gluten-free': '🌾',
  'dairy-free': '🥛',
  'nut-free': '🥜',
  keto: '🥑',
  'low-carb': '🥗',
  halal: '🕌',
  kosher: '✡️',
  spicy: '🌶️',
  organic: '🌿'
};

export function MenuItemManager() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [formData, setFormData] = useState<CreateMenuItemInput>({
    name: '',
    description: null,
    price: 0,
    ingredients: null,
    image_url: null,
    dietary_labels: [],
    is_available: true,
    display_order: 0,
    category_id: 0
  });

  const loadMenuItems = useCallback(async () => {
    try {
      const result = await trpc.getMenuItems.query();
      setMenuItems(result.sort((a: MenuItem, b: MenuItem) => a.display_order - b.display_order));
    } catch (error) {
      console.error('Failed to load menu items:', error);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const result = await trpc.getCategories.query();
      setCategories(result.filter((cat: Category) => cat.is_active));
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  useEffect(() => {
    loadMenuItems();
    loadCategories();
  }, [loadMenuItems, loadCategories]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: null,
      price: 0,
      ingredients: null,
      image_url: null,
      dietary_labels: [],
      is_available: true,
      display_order: menuItems.length,
      category_id: categories.length > 0 ? categories[0].id : 0
    });
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (editingItem) {
        const updateData: UpdateMenuItemInput = {
          id: editingItem.id,
          ...formData
        };
        await trpc.updateMenuItem.mutate(updateData);
      } else {
        await trpc.createMenuItem.mutate(formData);
      }
      
      await loadMenuItems();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save menu item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      ingredients: item.ingredients,
      image_url: item.image_url,
      dietary_labels: item.dietary_labels || [],
      is_available: item.is_available,
      display_order: item.display_order,
      category_id: item.category_id
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (itemId: number) => {
    try {
      await trpc.deleteMenuItem.mutate({ id: itemId });
      await loadMenuItems();
    } catch (error) {
      console.error('Failed to delete menu item:', error);
    }
  };

  const handleDietaryLabelChange = (label: DietaryLabel, checked: boolean) => {
    setFormData((prev: CreateMenuItemInput) => ({
      ...prev,
      dietary_labels: checked
        ? [...(prev.dietary_labels || []), label]
        : (prev.dietary_labels || []).filter((l: DietaryLabel) => l !== label)
    }));
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find((cat: Category) => cat.id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  const filteredMenuItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter((item: MenuItem) => item.category_id === parseInt(selectedCategory));

  return (
    <div className="space-y-6">
      {/* Header with Add Button and Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Manage Menu Items</h3>
          <p className="text-gray-600">Add and manage your restaurant's menu items</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category: Category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="bg-green-500 hover:bg-green-600">
                <Plus className="h-4 w-4 mr-2" />
                Add Menu Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Edit Menu Item' : 'Create New Menu Item'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Item Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateMenuItemInput) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="e.g., Margherita Pizza"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="price">Price ($) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateMenuItemInput) => ({
                          ...prev,
                          price: parseFloat(e.target.value) || 0
                        }))
                      }
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateMenuItemInput) => ({
                        ...prev,
                        description: e.target.value || null
                      }))
                    }
                    placeholder="Describe this delicious item..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="ingredients">Ingredients</Label>
                  <Textarea
                    id="ingredients"
                    value={formData.ingredients || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateMenuItemInput) => ({
                        ...prev,
                        ingredients: e.target.value || null
                      }))
                    }
                    placeholder="List the main ingredients..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select 
                      value={formData.category_id.toString()} 
                      onValueChange={(value: string) => 
                        setFormData((prev: CreateMenuItemInput) => ({
                          ...prev,
                          category_id: parseInt(value)
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category: Category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="display_order">Display Order</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateMenuItemInput) => ({
                          ...prev,
                          display_order: parseInt(e.target.value) || 0
                        }))
                      }
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    type="url"
                    value={formData.image_url || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateMenuItemInput) => ({
                        ...prev,
                        image_url: e.target.value || null
                      }))
                    }
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <Label>Dietary Labels</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {DIETARY_LABELS.map((label: DietaryLabel) => (
                      <div key={label} className="flex items-center space-x-2">
                        <Checkbox
                          id={label}
                          checked={(formData.dietary_labels || []).includes(label)}
                          onCheckedChange={(checked: boolean) => handleDietaryLabelChange(label, checked)}
                        />
                        <Label htmlFor={label} className="text-sm flex items-center gap-1">
                          {DIETARY_LABEL_EMOJIS[label]} {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_available"
                    checked={formData.is_available || false}
                    onCheckedChange={(checked: boolean) =>
                      setFormData((prev: CreateMenuItemInput) => ({ ...prev, is_available: checked }))
                    }
                  />
                  <Label htmlFor="is_available">Available for order</Label>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading || categories.length === 0}>
                    {isLoading ? 'Saving...' : editingItem ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Menu Items List */}
      {filteredMenuItems.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <UtensilsCrossed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {selectedCategory === 'all' ? 'No menu items yet' : 'No items in this category'}
            </p>
            <p className="text-gray-400">
              {categories.length === 0 
                ? 'Create categories first, then add menu items!'
                : 'Create your first menu item to get started!'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredMenuItems.map((item: MenuItem) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {/* Item Image */}
                  <div className="flex-shrink-0">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded-lg"
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          e.currentTarget.src = '';
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Image className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900">{item.name}</h4>
                        <p className="text-gray-600 text-sm">{getCategoryName(item.category_id)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-green-600">
                          ${item.price.toFixed(2)}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{item.name}"? 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(item.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>

                    {item.description && (
                      <p className="text-gray-700 mb-2">{item.description}</p>
                    )}

                    {item.ingredients && (
                      <p className="text-gray-600 text-sm mb-3">
                        <strong>Ingredients:</strong> {item.ingredients}
                      </p>
                    )}

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant={item.is_available ? "default" : "destructive"}>
                        {item.is_available ? 'Available' : 'Out of Stock'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Order: {item.display_order}
                      </Badge>
                      {item.dietary_labels && item.dietary_labels.map((label: DietaryLabel) => (
                        <Badge key={label} variant="secondary" className="text-xs">
                          {DIETARY_LABEL_EMOJIS[label]} {label}
                        </Badge>
                      ))}
                    </div>

                    <p className="text-xs text-gray-400">
                      Created: {item.created_at.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}