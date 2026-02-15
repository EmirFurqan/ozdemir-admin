"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveProductGroup } from "@/app/actions/productGroup";

export default function ProductGroupForm({ group }: { group?: any }) {
    const [state, formAction] = useActionState(saveProductGroup, null);

    return (
        <form action={formAction} className="max-w-2xl mx-auto">
            {group?.id && <input type="hidden" name="id" value={group.id} />}

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Grup Kodu</label>
                            <Input
                                name="groupCode"
                                defaultValue={group?.groupCode}
                                required
                                placeholder="Örn: 8100XX"
                                className="bg-slate-50"
                            />
                            <p className="text-[10px] text-slate-500">
                                Benzersiz bir kod olmalıdır.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Grup Adı</label>
                            <Input
                                name="name"
                                defaultValue={group?.name}
                                required
                                placeholder="Örn: Üstten Depo Tabancalar"
                                className="bg-slate-50"
                            />
                        </div>
                    </div>
                </div>

                {state?.message && (
                    <div className="p-3 bg-red-100 text-red-600 rounded text-sm border border-red-200">
                        {state.message}
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-sm">
                        Kaydet
                    </Button>
                    <Button type="button" variant="outline" onClick={() => window.history.back()} className="flex-1">
                        Vazgeç
                    </Button>
                </div>
            </div>
        </form>
    );
}
