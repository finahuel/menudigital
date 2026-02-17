import * as Papa from 'papaparse';
import type { Product, MenuSectionData } from '../types/Menu';

// ID público de tu hoja de cálculo (Reemplaza esto con el tuyo real)
const SHEET_ID = '1AFPONiNdDpSnEulMG2v43t86H4icpQ2DUs_-nffFUvA'; 
const GID = '0'; // Asumimos que la pestaña "Productos" es la primera (gid=0)

const CATEGORY_COLUMN = 'Categoria'; // Columna para agrupar

export async function fetchMenuData(): Promise<MenuSectionData[]> {
    // Usamos /export en lugar de /pub. Esto funciona si compartiste la hoja como "Cualquiera con el enlace"
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

    try {
        const response = await fetch(url);
        const csvText = await response.text();

        // Verificación: Si Google nos devuelve HTML (login), es que no tenemos permiso
        if (csvText.trim().startsWith('<!DOCTYPE') || csvText.includes('<html')) {
            console.error('\n❌ ERROR: La hoja de cálculo no es pública. Ve a Compartir > Cualquier persona con el enlace.\n');
            return [];
        }

        const parsed = Papa.parse<Product>(csvText, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true, // ¡Importante! Convierte números y booleanos automáticamente
        });

        const products = parsed.data;

        if (products.length === 0) {
            console.warn('⚠️ No se encontraron productos en la hoja de cálculo.');
            return [];
        }

        // Verificación: Asegurarnos que la columna de categoría existe en los datos
        const firstProductKeys = Object.keys(products[0]);
        if (!firstProductKeys.includes(CATEGORY_COLUMN)) {
            console.error(`\n❌ ERROR: La columna para agrupar "${CATEGORY_COLUMN}" no se encontró en la hoja.`);
            console.error(`👉 Columnas encontradas: [${firstProductKeys.join(', ')}]`);
            console.error('Asegúrate de que el nombre de la columna en Google Sheets sea exacto.\n');
            return [];
        }

        // Agrupar productos por la columna "Categoria"
        const grouped = products.reduce((acc: Record<string, Product[]>, product: Product) => {
            const categoryName = product[CATEGORY_COLUMN] || 'Otros';
            if (!acc[categoryName]) {
                acc[categoryName] = [];
            }
            acc[categoryName].push(product);
            return acc;
        }, {} as Record<string, Product[]>);

        // Convertir el objeto agrupado en un array para la vista
        return Object.entries(grouped).map(([categoryName, categoryProducts]) => ({
            id: categoryName,
            products: categoryProducts
        }));

    } catch (error) {
        console.error('Error fetching menu:', error);
        return [];
    }
}