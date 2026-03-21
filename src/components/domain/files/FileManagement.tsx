"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  File, 
  Upload, 
  Trash2, 
  Download, 
  Search, 
  Plus, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Music, 
  MoreVertical,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useT } from '@/hooks/use-t';
import { filesApi } from '@/lib/api/files';
import { UserFile } from '@/types/domain';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const FileManagement: React.FC = () => {
  const { t, locale } = useT();
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<UserFile | null>(null);

  const dateLocale = locale === 'vi' ? vi : enUS;

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await filesApi.getAll();
      setFiles(data);
    } catch (error) {
      console.error('Failed to fetch files:', error);
      toast.error(t('common.noData'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      await filesApi.upload(file);
      toast.success(t('files.uploadSuccess'));
      fetchFiles();
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(t('common.generic'));
    } finally {
      setUploading(false);
      // Reset input
      if (event.target) event.target.value = '';
    }
  };

  const handleDeleteFile = async () => {
    if (!fileToDelete) return;

    try {
      await filesApi.delete(fileToDelete._id);
      toast.success(t('files.deleteSuccess'));
      setFiles(prev => prev.filter(f => f._id !== fileToDelete._id));
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(t('common.generic'));
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-blue-500" />;
    if (type.startsWith('video/')) return <Video className="w-8 h-8 text-purple-500" />;
    if (type.startsWith('audio/')) return <Music className="w-8 h-8 text-pink-500" />;
    if (type.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    return <File className="w-8 h-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('files.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t('student.classes.subtitle', { count: files.length })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder={t('files.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <label className="cursor-pointer">
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <Button asChild disabled={uploading} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <span>
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {t('files.uploadTitle')}
              </span>
            </Button>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filteredFiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <div 
              key={file._id}
              className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 transition-all hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-500"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  {getFileIcon(file.type)}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a 
                    href={file.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-1.5 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button 
                    onClick={() => {
                      setFileToDelete(file);
                      setDeleteDialogOpen(true);
                    }}
                    className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate" title={file.name}>
                  {file.name}
                </h3>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{formatFileSize(file.size)}</span>
                  <span>{format(new Date(file.createdAt), 'dd/MM/yyyy', { locale: dateLocale })}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500">
                  {file.type.split('/')[1] || 'FILE'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-full shadow-sm mb-4">
            <Upload className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {t('files.empty')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {searchQuery ? t('student.classes.noResults', { query: searchQuery }) : t('absenceRequests.request.dropText')}
          </p>
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              {t('common.delete')}
            </DialogTitle>
            <DialogDescription>
              {t('files.deleteConfirm')}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg flex items-center gap-3">
            {fileToDelete && getFileIcon(fileToDelete.type)}
            <span className="font-medium text-gray-900 dark:text-white truncate">
              {fileToDelete?.name}
            </span>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteFile}>
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FileManagement;
