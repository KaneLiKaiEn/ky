export interface CatalogRowLike {
    catalog_id?: number;
    parent_id?: number;
    catalog_name?: string;
    sort_no?: string;
}
export interface CatalogNode<T extends CatalogRowLike = CatalogRowLike> {
    key: number;
    row: T;
    children: CatalogNode<T>[];
}
export declare function catalogTree<T extends CatalogRowLike>(rows: T[], query?: string): CatalogNode<T>[];
