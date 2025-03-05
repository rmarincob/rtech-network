const { BaseEntity, Column, Entity, PrimaryColumn } = require('typeorm');

@Entity({ name: 'users', schema: 'public' })
class Users extends BaseEntity {

    @PrimaryColumn({ name: 'id', type: 'int8' })
    id

    @Column({ name: 'document', type: 'varchar', unique: true, length: 255 })
    document

    @Column({ name: 'encryption_key', type: 'varchar', unique: true, length: 255 })
    encryptionKey

    @Column({ name: 'created_at', type: 'timestamp' })
    createdAt
}

module.exports = Users;