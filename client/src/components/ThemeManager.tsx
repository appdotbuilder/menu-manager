import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Slider } from '@/components/ui/slider';
import { Plus, Edit, Trash2, Palette, Eye } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { MenuTheme, CreateMenuThemeInput, UpdateMenuThemeInput } from '../../../server/src/schema';

export function ThemeManager() {
  const [themes, setThemes] = useState<MenuTheme[]>([]);
  const [activeTheme, setActiveTheme] = useState<MenuTheme | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTheme, setEditingTheme] = useState<MenuTheme | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState<CreateMenuThemeInput>({
    restaurant_name: '',
    button_color: '#FF6B35',
    button_shape: 'rounded',
    background_type: 'color',
    background_value: '#FFFFFF',
    border_radius: 10,
    primary_color: '#FF6B35',
    text_color: '#1F2937',
    is_active: false
  });

  const loadThemes = useCallback(async () => {
    try {
      const result = await trpc.getMenuThemes.query();
      setThemes(result);
    } catch (error) {
      console.error('Failed to load themes:', error);
    }
  }, []);

  const loadActiveTheme = useCallback(async () => {
    try {
      const result = await trpc.getActiveMenuTheme.query();
      setActiveTheme(result);
    } catch (error) {
      console.error('Failed to load active theme:', error);
    }
  }, []);

  useEffect(() => {
    loadThemes();
    loadActiveTheme();
  }, [loadThemes, loadActiveTheme]);

  const resetForm = () => {
    setFormData({
      restaurant_name: '',
      button_color: '#FF6B35',
      button_shape: 'rounded',
      background_type: 'color',
      background_value: '#FFFFFF',
      border_radius: 10,
      primary_color: '#FF6B35',
      text_color: '#1F2937',
      is_active: false
    });
    setEditingTheme(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (editingTheme) {
        const updateData: UpdateMenuThemeInput = {
          id: editingTheme.id,
          ...formData
        };
        await trpc.updateMenuTheme.mutate(updateData);
      } else {
        await trpc.createMenuTheme.mutate(formData);
      }
      
      await loadThemes();
      await loadActiveTheme();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (theme: MenuTheme) => {
    setEditingTheme(theme);
    setFormData({
      restaurant_name: theme.restaurant_name,
      button_color: theme.button_color,
      button_shape: theme.button_shape,
      background_type: theme.background_type,
      background_value: theme.background_value,
      border_radius: theme.border_radius,
      primary_color: theme.primary_color,
      text_color: theme.text_color,
      is_active: theme.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (themeId: number) => {
    try {
      await trpc.deleteMenuTheme.mutate({ id: themeId });
      await loadThemes();
      await loadActiveTheme();
    } catch (error) {
      console.error('Failed to delete theme:', error);
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getShapeLabel = (shape: string) => {
    switch (shape) {
      case 'rounded': return 'Rounded';
      case 'square': return 'Square';
      case 'pill': return 'Pill';
      default: return shape;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Menu Theme Management</h3>
          <p className="text-gray-600">Customize the appearance of your digital menu</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-purple-500 hover:bg-purple-600">
              <Plus className="h-4 w-4 mr-2" />
              Create Theme
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTheme ? 'Edit Theme' : 'Create New Theme'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="restaurant_name">Restaurant Name *</Label>
                <Input
                  id="restaurant_name"
                  value={formData.restaurant_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateMenuThemeInput) => ({ ...prev, restaurant_name: e.target.value }))
                  }
                  placeholder="e.g., Bella's Italian Kitchen"
                  required
                />
              </div>

              {/* Colors Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Colors</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="primary_color">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primary_color"
                        type="color"
                        value={formData.primary_color}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateMenuThemeInput) => ({ ...prev, primary_color: e.target.value }))
                        }
                        className="w-12 h-10 p-1 rounded"
                      />
                      <Input
                        value={formData.primary_color}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateMenuThemeInput) => ({ ...prev, primary_color: e.target.value }))
                        }
                        placeholder="#FF6B35"
                        pattern="^#[0-9A-Fa-f]{6}$"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="button_color">Button Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="button_color"
                        type="color"
                        value={formData.button_color}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateMenuThemeInput) => ({ ...prev, button_color: e.target.value }))
                        }
                        className="w-12 h-10 p-1 rounded"
                      />
                      <Input
                        value={formData.button_color}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateMenuThemeInput) => ({ ...prev, button_color: e.target.value }))
                        }
                        placeholder="#FF6B35"
                        pattern="^#[0-9A-Fa-f]{6}$"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="text_color">Text Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="text_color"
                        type="color"
                        value={formData.text_color}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateMenuThemeInput) => ({ ...prev, text_color: e.target.value }))
                        }
                        className="w-12 h-10 p-1 rounded"
                      />
                      <Input
                        value={formData.text_color}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateMenuThemeInput) => ({ ...prev, text_color: e.target.value }))
                        }
                        placeholder="#1F2937"
                        pattern="^#[0-9A-Fa-f]{6}$"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Background Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Background</h4>
                <div>
                  <Label>Background Type</Label>
                  <Select 
                    value={formData.background_type || 'color'} 
                    onValueChange={(value: 'color' | 'image') => 
                      setFormData((prev: CreateMenuThemeInput) => ({ ...prev, background_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="color">Solid Color</SelectItem>
                      <SelectItem value="image">Background Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="background_value">
                    {formData.background_type === 'color' ? 'Background Color' : 'Image URL'}
                  </Label>
                  {formData.background_type === 'color' ? (
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.background_value}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateMenuThemeInput) => ({ ...prev, background_value: e.target.value }))
                        }
                        className="w-12 h-10 p-1 rounded"
                      />
                      <Input
                        value={formData.background_value}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateMenuThemeInput) => ({ ...prev, background_value: e.target.value }))
                        }
                        placeholder="#FFFFFF"
                      />
                    </div>
                  ) : (
                    <Input
                      id="background_value"
                      type="url"
                      value={formData.background_value}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateMenuThemeInput) => ({ ...prev, background_value: e.target.value }))
                      }
                      placeholder="https://example.com/background.jpg"
                    />
                  )}
                </div>
              </div>

              {/* Style Options */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Style Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Button Shape</Label>
                    <Select 
                      value={formData.button_shape || 'rounded'} 
                      onValueChange={(value: 'rounded' | 'square' | 'pill') => 
                        setFormData((prev: CreateMenuThemeInput) => ({ ...prev, button_shape: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rounded">Rounded</SelectItem>
                        <SelectItem value="square">Square</SelectItem>
                        <SelectItem value="pill">Pill</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Border Radius: {formData.border_radius}%</Label>
                    <Slider
                      value={[formData.border_radius]}
                      onValueChange={([value]: number[]) =>
                        setFormData((prev: CreateMenuThemeInput) => ({ ...prev, border_radius: value }))
                      }
                      min={0}
                      max={50}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active || false}
                  onCheckedChange={(checked: boolean) =>
                    setFormData((prev: CreateMenuThemeInput) => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="is_active">Set as active theme</Label>
              </div>

              {/* Preview Section */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div 
                  className="p-6 rounded-lg border-2 border-dashed border-gray-300"
                  style={{
                    backgroundColor: formData.background_type === 'color' ? formData.background_value : '#FFFFFF',
                    backgroundImage: formData.background_type === 'image' ? `url(${formData.background_value})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    color: formData.text_color
                  }}
                >
                  <h3 className="text-xl font-bold mb-4" style={{ color: formData.primary_color }}>
                    {formData.restaurant_name || 'Restaurant Name'}
                  </h3>
                  <button 
                    className="px-4 py-2 text-white font-medium"
                    style={{
                      backgroundColor: formData.button_color,
                      borderRadius: formData.button_shape === 'pill' ? '9999px' : 
                                   formData.button_shape === 'square' ? '0px' : 
                                   `${formData.border_radius / 10}rem`
                    }}
                  >
                    Sample Button
                  </button>
                  <p className="mt-3 text-sm opacity-75">
                    This is how your menu theme will look to customers.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : editingTheme ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Theme Display */}
      {activeTheme && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-700 flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Currently Active Theme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-semibold">{activeTheme.restaurant_name}</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge style={{ backgroundColor: activeTheme.primary_color, color: activeTheme.text_color }}>
                    Primary: {activeTheme.primary_color}
                  </Badge>
                  <Badge variant="outline">
                    Shape: {getShapeLabel(activeTheme.button_shape)}
                  </Badge>
                  <Badge variant="outline">
                    Background: {activeTheme.background_type}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(activeTheme)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Themes List */}
      {themes.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No themes created yet</p>
            <p className="text-gray-400">Create your first theme to customize your menu!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {themes.map((theme: MenuTheme) => (
            <Card key={theme.id} className={`hover:shadow-md transition-shadow ${theme.is_active ? 'ring-2 ring-green-200' : ''}`}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-lg font-semibold">{theme.restaurant_name}</h4>
                      {theme.is_active && (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Primary Color</p>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: theme.primary_color }}
                          ></div>
                          <span className="text-sm font-mono">{theme.primary_color}</span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Button Color</p>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: theme.button_color }}
                          ></div>
                          <span className="text-sm font-mono">{theme.button_color}</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Shape</p>
                        <p className="text-sm">{getShapeLabel(theme.button_shape)}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Background</p>
                        <p className="text-sm capitalize">{theme.background_type}</p>
                      </div>
                    </div>

                    {/* Preview */}
                    <div 
                      className="p-4 rounded-lg border"
                      style={{
                        backgroundColor: theme.background_type === 'color' ? theme.background_value : '#FFFFFF',
                        backgroundImage: theme.background_type === 'image' ? `url(${theme.background_value})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        color: theme.text_color
                      }}
                    >
                      <h5 className="font-medium mb-2" style={{ color: theme.primary_color }}>
                        Preview
                      </h5>
                      <button 
                        className="px-3 py-1 text-white text-sm"
                        style={{
                          backgroundColor: theme.button_color,
                          borderRadius: theme.button_shape === 'pill' ? '9999px' : 
                                       theme.button_shape === 'square' ? '0px' : 
                                       `${theme.border_radius / 10}rem`
                        }}
                      >
                        Sample Button
                      </button>
                    </div>

                    <p className="text-xs text-gray-400 mt-3">
                      Created: {theme.created_at.toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(theme)}
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
                          <AlertDialogTitle>Delete Theme</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the theme "{theme.restaurant_name}"? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(theme.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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