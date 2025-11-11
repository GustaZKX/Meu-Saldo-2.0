'use client';
import { useState } from 'react';
import { Pencil, LogOut } from 'lucide-react';
import { useAppContext } from '@/contexts/app-context';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


export default function Header() {
  const { state, updateUsername, resetApp } = useAppContext();
  const [newUsername, setNewUsername] = useState(state.user.username);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);

  const handleSaveUsername = () => {
    if (newUsername.trim()) {
      updateUsername(newUsername.trim());
      setIsEditUserOpen(false);
    }
  };

  return (
    <header className="bg-primary text-primary-foreground p-4">
      <div className="flex justify-between items-center">
        <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
          <DialogTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer group">
              <span className="text-sm sm:text-base">
                Olá, <span className="font-bold">{state.user.username}</span>
              </span>
              <Pencil className="h-4 w-4 text-amber-300 group-hover:text-amber-400 transition-colors" />
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Nome de Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-username">Novo Nome</Label>
                <Input
                  id="new-username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Seu nome ou apelido"
                />
              </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleSaveUsername}>Salvar Nome</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-amber-300 hover:bg-primary/50 hover:text-amber-400 gap-2">
                <span className="hidden sm:inline">[Sair/Resetar]</span>
                <LogOut className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Atenção!</AlertDialogTitle>
              <AlertDialogDescription>
                Isso apagará todos os seus dados salvos localmente (ganhos, despesas, metas) e reiniciará o aplicativo. Deseja continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={resetApp} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Sim, Resetar Tudo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </header>
  );
}
