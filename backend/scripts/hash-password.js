import { hashPassword } from '../src/services/auth';
/**
 * Script pour générer un hash de mot de passe
 * Usage: tsx scripts/hash-password.ts <mot-de-passe>
 */
async function main() {
    const password = process.argv[2];
    if (!password) {
        console.error('Usage: tsx scripts/hash-password.ts <mot-de-passe>');
        process.exit(1);
    }
    console.log('Hashing password...');
    const hash = await hashPassword(password);
    console.log('\n✅ Hash généré :');
    console.log(hash);
    console.log('\nCopiez ce hash dans votre config.json sous "auth.passwordHash"');
}
main().catch(console.error);
//# sourceMappingURL=hash-password.js.map