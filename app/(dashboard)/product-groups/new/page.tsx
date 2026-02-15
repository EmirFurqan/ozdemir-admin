
import { productService } from "@/app/services/productService";
import CreateGroupForm from "../CreateGroupForm";

export default async function NewProductGroupPage() {
    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-2xl font-bold mb-8 text-center">Yeni Ürün Grubu Ekle</h1>
            <CreateGroupForm allProducts={[]} />
        </div>
    );
}
