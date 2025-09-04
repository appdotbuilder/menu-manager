
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MenuItemManager } from '@/components/MenuItemManager';
import { CategoryManager } from '@/components/CategoryManager';
import { ThemeManager } from '@/components/ThemeManager';
import { QRCodeManager } from '@/components/QRCodeManager';
import { UtensilsCrossed, Palette, QrCode, FolderOpen } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <UtensilsCrossed className="h-10 w-10 text-orange-600" />
            Restaurant Menu Manager
          </h1>
          <p className="text-gray-600 text-lg">
            Manage your menu items, customize themes, and generate QR codes 🍽️
          </p>
        </div>

        {/* Main Navigation Tabs */}
        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-white shadow-md rounded-lg">
            <TabsTrigger 
              value="categories" 
              className="flex items-center gap-2 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700"
            >
              <FolderOpen className="h-4 w-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger 
              value="menu-items"
              className="flex items-center gap-2 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700"
            >
              <UtensilsCrossed className="h-4 w-4" />
              Menu Items
            </TabsTrigger>
            <TabsTrigger 
              value="themes"
              className="flex items-center gap-2 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700"
            >
              <Palette className="h-4 w-4" />
              Themes
            </TabsTrigger>
            <TabsTrigger 
              value="qr-codes"
              className="flex items-center gap-2 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700"
            >
              <QrCode className="h-4 w-4" />
              QR Codes
            </TabsTrigger>
          </TabsList>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Category Management
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <CategoryManager />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Menu Items Tab */}
          <TabsContent value="menu-items" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <UtensilsCrossed className="h-5 w-5" />
                  Menu Item Management
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <MenuItemManager />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Themes Tab */}
          <TabsContent value="themes" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Theme Customization
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ThemeManager />
              </CardContent>
            </Card>
          </TabsContent>

          {/* QR Codes Tab */}
          <TabsContent value="qr-codes" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  QR Code Generator
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <QRCodeManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;