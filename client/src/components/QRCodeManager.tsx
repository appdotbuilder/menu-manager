import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, QrCode, Download, RefreshCw, ExternalLink } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { QRCode as QRCodeType, CreateQRCodeInput, UpdateQRCodeInput } from '../../../server/src/schema';

export function QRCodeManager() {
  const [qrCodes, setQrCodes] = useState<QRCodeType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingQRCode, setEditingQRCode] = useState<QRCodeType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<CreateQRCodeInput>({
    name: '',
    menu_url: '',
    is_active: true
  });

  const loadQRCodes = useCallback(async () => {
    try {
      const result = await trpc.getQRCodes.query();
      setQrCodes(result.sort((a: QRCodeType, b: QRCodeType) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (error) {
      console.error('Failed to load QR codes:', error);
    }
  }, []);

  useEffect(() => {
    loadQRCodes();
  }, [loadQRCodes]);

  const resetForm = () => {
    setFormData({
      name: '',
      menu_url: '',
      is_active: true
    });
    setEditingQRCode(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (editingQRCode) {
        const updateData: UpdateQRCodeInput = {
          id: editingQRCode.id,
          ...formData
        };
        await trpc.updateQRCode.mutate(updateData);
      } else {
        await trpc.createQRCode.mutate(formData);
      }
      
      await loadQRCodes();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save QR code:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (qrCode: QRCodeType) => {
    setEditingQRCode(qrCode);
    setFormData({
      name: qrCode.name,
      menu_url: qrCode.menu_url,
      is_active: qrCode.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (qrCodeId: number) => {
    try {
      await trpc.deleteQRCode.mutate({ id: qrCodeId });
      await loadQRCodes();
    } catch (error) {
      console.error('Failed to delete QR code:', error);
    }
  };

  const handleRegenerate = async (qrCodeId: number) => {
    setRegeneratingId(qrCodeId);
    try {
      await trpc.regenerateQRCode.mutate({ id: qrCodeId });
      await loadQRCodes();
    } catch (error) {
      console.error('Failed to regenerate QR code:', error);
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleDownload = async (qrCode: QRCodeType) => {
    try {
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = qrCode.qr_code_url;
      link.download = `${qrCode.name.replace(/[^a-z0-9]/gi, '_')}_QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download QR code:', error);
      // Fallback: open in new tab
      window.open(qrCode.qr_code_url, '_blank');
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">QR Code Management</h3>
          <p className="text-gray-600">Generate downloadable QR codes for your digital menu 📱</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-blue-500 hover:bg-blue-600">
              <Plus className="h-4 w-4 mr-2" />
              Generate QR Code
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingQRCode ? 'Edit QR Code' : 'Generate New QR Code'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">QR Code Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateQRCodeInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Table 5, Main Menu, Lunch Special"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="menu_url">Menu URL *</Label>
                <Input
                  id="menu_url"
                  type="url"
                  value={formData.menu_url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateQRCodeInput) => ({ ...prev, menu_url: e.target.value }))
                  }
                  placeholder="https://yourmenu.com/menu"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is the URL customers will visit when they scan the QR code
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active || false}
                  onCheckedChange={(checked: boolean) =>
                    setFormData((prev: CreateQRCodeInput) => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="is_active">Active QR Code</Label>
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
                  {isLoading ? 'Generating...' : editingQRCode ? 'Update' : 'Generate'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* QR Codes List */}
      {qrCodes.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No QR codes generated yet</p>
            <p className="text-gray-400">Create your first QR code to share your digital menu!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {qrCodes.map((qrCode: QRCodeType) => (
            <Card key={qrCode.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {qrCode.name}
                    <Badge variant={qrCode.is_active ? "default" : "secondary"}>
                      {qrCode.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(qrCode)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete QR Code</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{qrCode.name}"? 
                            This action cannot be undone and existing printed QR codes will no longer work.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(qrCode.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* QR Code Image */}
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                    <img
                      src={qrCode.qr_code_url}
                      alt={`QR code for ${qrCode.name}`}
                      className="w-32 h-32"
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </div>

                {/* Menu URL */}
                <div>
                  <Label className="text-xs text-gray-600">Menu URL</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-blue-600 truncate flex-1">
                      {qrCode.menu_url}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(qrCode.menu_url, '_blank')}
                      className="p-1 h-auto"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(qrCode)}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRegenerate(qrCode.id)}
                    disabled={regeneratingId === qrCode.id}
                    className="flex-1"
                  >
                    {regeneratingId === qrCode.id ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Regenerating
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-xs text-gray-400 text-center">
                  Created: {qrCode.created_at.toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Usage Tips */}
      {qrCodes.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              QR Code Usage Tips 💡
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Print QR codes on table tents, menus, or posters for easy customer access</li>
              <li>• Test each QR code with multiple devices before printing</li>
              <li>• Make sure your menu URL is always accessible and mobile-friendly</li>
              <li>• Consider creating different QR codes for different locations or table sections</li>
              <li>• Use the regenerate feature if you need to update the QR code design</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}