export interface Product {
    Producto: string;
    Ingrediente: string;
    Precio: number;
    Foto: string;
    Categoria: string;
}

export interface MenuSectionData {
    id: string; // Nombre de la categoría
    products: Product[];
}