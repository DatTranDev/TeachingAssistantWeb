'use client';

import { useState } from 'react';
import { BellOff, CalendarClock, Trash2 } from 'lucide-react';
import { useSubject } from '@/contexts/SubjectContext';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { SubjectSettingsForm } from '@/components/features/subjects/settings/SubjectSettingsForm';
import { CancelClassModal } from '@/components/features/subjects/settings/CancelClassModal';
import { RescheduleModal } from '@/components/features/subjects/settings/RescheduleModal';
import { DeleteSubjectDialog } from '@/components/features/subjects/settings/DeleteSubjectDialog';
import { useT } from '@/hooks/use-t';

export default function TeacherSettingsPage() {
  const { subjectId, subject, isLoading } = useSubject();
  const { user } = useAuth();
  const { t } = useT();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (!subject) return null;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Subject Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('subjects.settings.sectionInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <SubjectSettingsForm subject={subject} subjectId={subjectId} />
        </CardContent>
      </Card>

      {/* Class Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('subjects.settings.sectionNotifications')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{t('subjects.settings.cancelClassTitle')}</p>
              <p className="text-xs text-muted-foreground">
                {t('subjects.settings.cancelClassDesc')}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 text-destructive hover:text-destructive"
              onClick={() => setCancelOpen(true)}
            >
              <BellOff className="mr-2 h-4 w-4" />
              {t('subjects.settings.cancelClassBtn')}
            </Button>
          </div>

          <Separator />

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{t('subjects.settings.rescheduleTitle')}</p>
              <p className="text-xs text-muted-foreground">
                {t('subjects.settings.rescheduleDesc')}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => setRescheduleOpen(true)}
            >
              <CalendarClock className="mr-2 h-4 w-4" />
              {t('subjects.settings.rescheduleBtn')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base text-destructive">
            {t('subjects.settings.dangerZone')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{t('subjects.settings.deleteClassTitle')}</p>
              <p className="text-xs text-muted-foreground">
                {t('subjects.settings.deleteClassDesc')}
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="shrink-0"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('subjects.settings.deleteClassBtn')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <CancelClassModal open={cancelOpen} onOpenChange={setCancelOpen} subjectId={subjectId} />
      <RescheduleModal
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        subjectId={subjectId}
      />
      {user && (
        <DeleteSubjectDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          subjectId={subjectId}
          subjectName={subject.name}
          userId={user._id}
        />
      )}
    </div>
  );
}
