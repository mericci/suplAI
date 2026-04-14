'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircleIcon } from 'lucide-react';

interface DemoFormModalProps {
  open: boolean;
  onClose: () => void;
}

interface FormData {
  nombre: string;
  empresa: string;
  rut: string;
  email: string;
  telefono: string;
  tamano: string;
  mensaje: string;
}

const INITIAL_FORM: FormData = {
  nombre: '',
  empresa: '',
  rut: '',
  email: '',
  telefono: '',
  tamano: '',
  mensaje: '',
};

export function DemoFormModal({ open, onClose }: DemoFormModalProps): React.JSX.Element {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (): void => {
    onClose();
    setTimeout(() => {
      setSubmitted(false);
      setForm(INITIAL_FORM);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white">
        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-green-50">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold" style={{ color: '#0f0f0f' }}>¡Solicitud recibida!</h2>
            <p className="text-sm" style={{ color: 'rgba(0,0,0,0.55)' }}>
              Te contactaremos en menos de 24 horas hábiles para coordinar tu demo gratuita.
            </p>
            <Button
              onClick={handleClose}
              className="mt-2"
              style={{ backgroundColor: '#0f0f0f', color: '#ffffff' }}
            >
              Cerrar
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl" style={{ color: '#0f0f0f' }}>Solicitar Demo gratuita</DialogTitle>
              <DialogDescription style={{ color: 'rgba(0,0,0,0.50)' }}>
                Completa tus datos y te contactamos en menos de 24 horas hábiles.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nombre" className="text-sm" style={{ color: 'rgba(0,0,0,0.70)' }}>
                    Nombre completo *
                  </Label>
                  <Input id="nombre" required value={form.nombre} onChange={handleChange('nombre')} placeholder="Juan Pérez" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="empresa" className="text-sm" style={{ color: 'rgba(0,0,0,0.70)' }}>
                    Empresa *
                  </Label>
                  <Input id="empresa" required value={form.empresa} onChange={handleChange('empresa')} placeholder="Mi Empresa S.A." />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rut" className="text-sm" style={{ color: 'rgba(0,0,0,0.70)' }}>
                  RUT empresa
                </Label>
                <Input id="rut" value={form.rut} onChange={handleChange('rut')} placeholder="76.123.456-7" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email" className="text-sm" style={{ color: 'rgba(0,0,0,0.70)' }}>
                    Correo corporativo *
                  </Label>
                  <Input id="email" type="email" required value={form.email} onChange={handleChange('email')} placeholder="juan@empresa.cl" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="telefono" className="text-sm" style={{ color: 'rgba(0,0,0,0.70)' }}>
                    Teléfono
                  </Label>
                  <Input id="telefono" type="tel" value={form.telefono} onChange={handleChange('telefono')} placeholder="+56 9 1234 5678" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tamano" className="text-sm" style={{ color: 'rgba(0,0,0,0.70)' }}>
                  Tamaño empresa
                </Label>
                <Select value={form.tamano} onValueChange={(val) => setForm((prev) => ({ ...prev, tamano: val }))}>
                  <SelectTrigger id="tamano">
                    <SelectValue placeholder="Selecciona..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1 - 10 empleados</SelectItem>
                    <SelectItem value="11-50">11 - 50 empleados</SelectItem>
                    <SelectItem value="51-200">51 - 200 empleados</SelectItem>
                    <SelectItem value="200+">Más de 200</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="mensaje" className="text-sm" style={{ color: 'rgba(0,0,0,0.70)' }}>
                  Cuéntanos tu situación actual (opcional)
                </Label>
                <Textarea
                  id="mensaje"
                  value={form.mensaje}
                  onChange={handleChange('mensaje')}
                  placeholder="Ej: Actualmente gestionamos ~50 facturas mensuales en Excel..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-sm font-semibold rounded-xl mt-2 cursor-pointer"
                style={{ backgroundColor: '#0f0f0f', color: '#ffffff' }}
              >
                {loading ? 'Enviando...' : 'Enviar solicitud →'}
              </Button>

              <p className="text-center text-xs" style={{ color: 'rgba(0,0,0,0.35)' }}>
                Sin tarjeta de crédito · Configuración asistida · Soporte en español
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
