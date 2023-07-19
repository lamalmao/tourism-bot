import path from 'path';
import fs from 'fs';
import Logger from '../logger.js';

export default class TreeLoader {
  private readonly _treePath: string;
  private _treeObject?: object;

  private static readonly _DefaultPath = path.resolve(
    './parameters/files-tree.json'
  );

  constructor(treePath: string = TreeLoader._DefaultPath) {
    this._treePath = treePath;
    this._load();
  }

  private _load() {
    this._treeObject = JSON.parse(fs.readFileSync(this._treePath).toString());
  }

  public buildTree() {
    if (!this._treeObject) {
      return;
    }

    const tree = this._treeObject;

    for (const branch of Object.keys(tree)) {
      this._makeBranch<typeof tree>(tree, branch as keyof typeof tree);
    }
  }

  private _makeBranch<T>(branch: T, item: keyof T, parent = './') {
    const currentBranch = branch[item];
    const currentFolder = path.resolve(parent, item as string);

    try {
      if (!fs.existsSync(currentFolder)) {
        fs.mkdirSync(currentFolder);
      }
    } catch (error) {
      Logger.error((error as Error).message);
    }

    if (currentBranch && typeof currentBranch === 'object') {
      for (const childBranch of Object.keys(currentBranch)) {
        this._makeBranch<typeof currentBranch>(
          currentBranch,
          childBranch as keyof typeof currentBranch,
          currentFolder
        );
      }
    }
  }
}
