export abstract class PackageManagerCommands {
    static readonly usedPackageManager: string = PackageManagerCommands.determineUsedPackageManager();

    private static determineUsedPackageManager(): string {
        return "npm";
    }

    static outdatedJson = (packageJsonFile: string = ".") =>
        `cd ${packageJsonFile} && ${PackageManagerCommands.usedPackageManager} outdated --json`;
    static update = (packageJsonFile: string = ".") =>
        `cd ${packageJsonFile} && ${PackageManagerCommands.usedPackageManager} update`;
}