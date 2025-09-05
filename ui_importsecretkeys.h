/********************************************************************************
** Form generated from reading UI file 'importsecretkeys.ui'
**
** Created by: Qt User Interface Compiler version 5.15.16
**
** WARNING! All changes made in this file will be lost when recompiling UI file!
********************************************************************************/

#ifndef UI_IMPORTSECRETKEYS_H
#define UI_IMPORTSECRETKEYS_H

#include <QtCore/QVariant>
#include <QtGui/QIcon>
#include <QtWidgets/QApplication>
#include <QtWidgets/QDialog>
#include <QtWidgets/QGroupBox>
#include <QtWidgets/QHBoxLayout>
#include <QtWidgets/QLabel>
#include <QtWidgets/QLineEdit>
#include <QtWidgets/QPushButton>
#include <QtWidgets/QSpacerItem>
#include <QtWidgets/QToolButton>
#include <QtWidgets/QVBoxLayout>

QT_BEGIN_NAMESPACE

class Ui_ImportSecretKeys
{
public:
    QVBoxLayout *verticalLayout_3;
    QGroupBox *groupBox;
    QVBoxLayout *verticalLayout_2;
    QLabel *label_4;
    QLabel *label_5;
    QSpacerItem *verticalSpacer_4;
    QLabel *label;
    QLineEdit *m_spendKey;
    QSpacerItem *verticalSpacer_3;
    QLabel *label_3;
    QLineEdit *m_viewKey;
    QSpacerItem *verticalSpacer_2;
    QLabel *label_2;
    QLabel *label_6;
    QGroupBox *horizontalGroupBox_1;
    QHBoxLayout *horizontalLayout;
    QLineEdit *m_pathEdit;
    QToolButton *m_selectPathButton;
    QSpacerItem *verticalSpacer;
    QGroupBox *horizontalGroupBox_2;
    QHBoxLayout *horizontalLayout_2;
    QPushButton *b1_okButton;
    QGroupBox *horizontalGroupBox_3;
    QHBoxLayout *horizontalLayout_3;
    QPushButton *b1_backButton;

    void setupUi(QDialog *ImportSecretKeys)
    {
        if (ImportSecretKeys->objectName().isEmpty())
            ImportSecretKeys->setObjectName(QString::fromUtf8("ImportSecretKeys"));
        ImportSecretKeys->resize(480, 550);
        ImportSecretKeys->setStyleSheet(QString::fromUtf8("background-color: #282d31; color: #ddd; border: 0px;"));
        verticalLayout_3 = new QVBoxLayout(ImportSecretKeys);
        verticalLayout_3->setSpacing(6);
        verticalLayout_3->setObjectName(QString::fromUtf8("verticalLayout_3"));
        verticalLayout_3->setContentsMargins(0, 0, 0, 0);
        groupBox = new QGroupBox(ImportSecretKeys);
        groupBox->setObjectName(QString::fromUtf8("groupBox"));
        QSizePolicy sizePolicy(QSizePolicy::Expanding, QSizePolicy::Expanding);
        sizePolicy.setHorizontalStretch(0);
        sizePolicy.setVerticalStretch(0);
        sizePolicy.setHeightForWidth(groupBox->sizePolicy().hasHeightForWidth());
        groupBox->setSizePolicy(sizePolicy);
        groupBox->setStyleSheet(QString::fromUtf8(""));
        groupBox->setAlignment(Qt::AlignLeading|Qt::AlignLeft|Qt::AlignTop);
        verticalLayout_2 = new QVBoxLayout(groupBox);
        verticalLayout_2->setObjectName(QString::fromUtf8("verticalLayout_2"));
        verticalLayout_2->setContentsMargins(50, 20, 50, 20);
        label_4 = new QLabel(groupBox);
        label_4->setObjectName(QString::fromUtf8("label_4"));
        QFont font;
        font.setFamily(QString::fromUtf8("Poppins"));
        font.setBold(true);
        font.setWeight(75);
        label_4->setFont(font);
        label_4->setStyleSheet(QString::fromUtf8("color: #fff;\n"
"border-right: 0px;\n"
"font-size: 20px;\n"
"font-weight: bold;"));
        label_4->setAlignment(Qt::AlignCenter);

        verticalLayout_2->addWidget(label_4);

        label_5 = new QLabel(groupBox);
        label_5->setObjectName(QString::fromUtf8("label_5"));
        QFont font1;
        font1.setFamily(QString::fromUtf8("Poppins"));
        label_5->setFont(font1);
        label_5->setStyleSheet(QString::fromUtf8("color: #ddd;border-right: 0px;"));
        label_5->setScaledContents(false);
        label_5->setAlignment(Qt::AlignCenter);
        label_5->setWordWrap(true);

        verticalLayout_2->addWidget(label_5);

        verticalSpacer_4 = new QSpacerItem(20, 40, QSizePolicy::Minimum, QSizePolicy::Expanding);

        verticalLayout_2->addItem(verticalSpacer_4);

        label = new QLabel(groupBox);
        label->setObjectName(QString::fromUtf8("label"));
        label->setFont(font);
        label->setStyleSheet(QString::fromUtf8("color: #ddd;border-right: 0px;\n"
"font-weight:bold;"));

        verticalLayout_2->addWidget(label);

        m_spendKey = new QLineEdit(groupBox);
        m_spendKey->setObjectName(QString::fromUtf8("m_spendKey"));
        m_spendKey->setMinimumSize(QSize(0, 40));
        m_spendKey->setFont(font1);
        m_spendKey->setStyleSheet(QString::fromUtf8("padding: 3px; border: 1px solid #555; border-radius: 5px;   color: #aaa; padding: 5px;"));

        verticalLayout_2->addWidget(m_spendKey);

        verticalSpacer_3 = new QSpacerItem(20, 20, QSizePolicy::Minimum, QSizePolicy::Expanding);

        verticalLayout_2->addItem(verticalSpacer_3);

        label_3 = new QLabel(groupBox);
        label_3->setObjectName(QString::fromUtf8("label_3"));
        label_3->setFont(font);
        label_3->setStyleSheet(QString::fromUtf8("color: #ddd;border-right: 0px;\n"
"font-weight:bold;"));

        verticalLayout_2->addWidget(label_3);

        m_viewKey = new QLineEdit(groupBox);
        m_viewKey->setObjectName(QString::fromUtf8("m_viewKey"));
        m_viewKey->setMinimumSize(QSize(0, 40));
        m_viewKey->setFont(font1);
        m_viewKey->setStyleSheet(QString::fromUtf8("padding: 3px; border: 1px solid #555; border-radius: 5px;   color: #aaa; padding: 5px;"));

        verticalLayout_2->addWidget(m_viewKey);

        verticalSpacer_2 = new QSpacerItem(20, 20, QSizePolicy::Minimum, QSizePolicy::Expanding);

        verticalLayout_2->addItem(verticalSpacer_2);

        label_2 = new QLabel(groupBox);
        label_2->setObjectName(QString::fromUtf8("label_2"));
        label_2->setFont(font);
        label_2->setStyleSheet(QString::fromUtf8("color: #ddd;border-right: 0px;\n"
"font-weight:bold;"));

        verticalLayout_2->addWidget(label_2);

        label_6 = new QLabel(groupBox);
        label_6->setObjectName(QString::fromUtf8("label_6"));

        verticalLayout_2->addWidget(label_6);

        horizontalGroupBox_1 = new QGroupBox(groupBox);
        horizontalGroupBox_1->setObjectName(QString::fromUtf8("horizontalGroupBox_1"));
        horizontalLayout = new QHBoxLayout(horizontalGroupBox_1);
        horizontalLayout->setSpacing(6);
        horizontalLayout->setObjectName(QString::fromUtf8("horizontalLayout"));
        horizontalLayout->setContentsMargins(0, 0, 0, 0);
        m_pathEdit = new QLineEdit(horizontalGroupBox_1);
        m_pathEdit->setObjectName(QString::fromUtf8("m_pathEdit"));
        QSizePolicy sizePolicy1(QSizePolicy::Expanding, QSizePolicy::Fixed);
        sizePolicy1.setHorizontalStretch(0);
        sizePolicy1.setVerticalStretch(0);
        sizePolicy1.setHeightForWidth(m_pathEdit->sizePolicy().hasHeightForWidth());
        m_pathEdit->setSizePolicy(sizePolicy1);
        m_pathEdit->setMinimumSize(QSize(300, 40));
        m_pathEdit->setFont(font1);
        m_pathEdit->setStyleSheet(QString::fromUtf8("padding: 3px; border: 1px solid #555; border-radius: 5px;   color: #aaa;"));

        horizontalLayout->addWidget(m_pathEdit);

        m_selectPathButton = new QToolButton(horizontalGroupBox_1);
        m_selectPathButton->setObjectName(QString::fromUtf8("m_selectPathButton"));
        QSizePolicy sizePolicy2(QSizePolicy::Minimum, QSizePolicy::Minimum);
        sizePolicy2.setHorizontalStretch(0);
        sizePolicy2.setVerticalStretch(0);
        sizePolicy2.setHeightForWidth(m_selectPathButton->sizePolicy().hasHeightForWidth());
        m_selectPathButton->setSizePolicy(sizePolicy2);
        m_selectPathButton->setMinimumSize(QSize(40, 40));
        m_selectPathButton->setStyleSheet(QString::fromUtf8("border: 1px solid #555; border-radius: 5px;   color: #aaa;"));
        m_selectPathButton->setText(QString::fromUtf8(""));
        QIcon icon;
        icon.addFile(QString::fromUtf8(":/icons/folder"), QSize(), QIcon::Normal, QIcon::Off);
        m_selectPathButton->setIcon(icon);

        horizontalLayout->addWidget(m_selectPathButton);


        verticalLayout_2->addWidget(horizontalGroupBox_1);

        verticalSpacer = new QSpacerItem(20, 40, QSizePolicy::Minimum, QSizePolicy::Expanding);

        verticalLayout_2->addItem(verticalSpacer);

        horizontalGroupBox_2 = new QGroupBox(groupBox);
        horizontalGroupBox_2->setObjectName(QString::fromUtf8("horizontalGroupBox_2"));
        horizontalLayout_2 = new QHBoxLayout(horizontalGroupBox_2);
        horizontalLayout_2->setSpacing(0);
        horizontalLayout_2->setObjectName(QString::fromUtf8("horizontalLayout_2"));
        horizontalLayout_2->setContentsMargins(0, 0, 0, 0);
        b1_okButton = new QPushButton(horizontalGroupBox_2);
        b1_okButton->setObjectName(QString::fromUtf8("b1_okButton"));
        QSizePolicy sizePolicy3(QSizePolicy::Preferred, QSizePolicy::Preferred);
        sizePolicy3.setHorizontalStretch(0);
        sizePolicy3.setVerticalStretch(0);
        sizePolicy3.setHeightForWidth(b1_okButton->sizePolicy().hasHeightForWidth());
        b1_okButton->setSizePolicy(sizePolicy3);
        b1_okButton->setMinimumSize(QSize(131, 50));
        b1_okButton->setMaximumSize(QSize(300, 16777215));
        b1_okButton->setFont(font1);
        b1_okButton->setStyleSheet(QString::fromUtf8("/* This style is handled automatically by EditableStyle.cpp */"));

        horizontalLayout_2->addWidget(b1_okButton);


        verticalLayout_2->addWidget(horizontalGroupBox_2);

        horizontalGroupBox_3 = new QGroupBox(groupBox);
        horizontalGroupBox_3->setObjectName(QString::fromUtf8("horizontalGroupBox_3"));
        horizontalLayout_3 = new QHBoxLayout(horizontalGroupBox_3);
        horizontalLayout_3->setSpacing(0);
        horizontalLayout_3->setObjectName(QString::fromUtf8("horizontalLayout_3"));
        horizontalLayout_3->setContentsMargins(0, 0, 0, 0);
        b1_backButton = new QPushButton(horizontalGroupBox_3);
        b1_backButton->setObjectName(QString::fromUtf8("b1_backButton"));
        sizePolicy3.setHeightForWidth(b1_backButton->sizePolicy().hasHeightForWidth());
        b1_backButton->setSizePolicy(sizePolicy3);
        b1_backButton->setMinimumSize(QSize(131, 50));
        b1_backButton->setMaximumSize(QSize(300, 16777215));
        b1_backButton->setFont(font1);
        b1_backButton->setStyleSheet(QString::fromUtf8("/* This style is handled automatically by EditableStyle.cpp */"));

        horizontalLayout_3->addWidget(b1_backButton);


        verticalLayout_2->addWidget(horizontalGroupBox_3);


        verticalLayout_3->addWidget(groupBox);


        retranslateUi(ImportSecretKeys);
        QObject::connect(b1_backButton, SIGNAL(clicked()), ImportSecretKeys, SLOT(reject()));
        QObject::connect(b1_okButton, SIGNAL(clicked()), ImportSecretKeys, SLOT(accept()));
        QObject::connect(m_selectPathButton, SIGNAL(clicked()), ImportSecretKeys, SLOT(selectPathClicked()));

        QMetaObject::connectSlotsByName(ImportSecretKeys);
    } // setupUi

    void retranslateUi(QDialog *ImportSecretKeys)
    {
        ImportSecretKeys->setWindowTitle(QCoreApplication::translate("ImportSecretKeys", "Dialog", nullptr));
        groupBox->setTitle(QString());
        label_4->setText(QCoreApplication::translate("ImportSecretKeys", "Import Private Keys", nullptr));
        label_5->setText(QCoreApplication::translate("ImportSecretKeys", "Recreate your wallet with the secret spend and view keys", nullptr));
        label->setText(QCoreApplication::translate("ImportSecretKeys", "Private Spend Key", nullptr));
        label_3->setText(QCoreApplication::translate("ImportSecretKeys", "Private View Key", nullptr));
        label_2->setText(QCoreApplication::translate("ImportSecretKeys", "Wallet Path", nullptr));
        label_6->setText(QCoreApplication::translate("ImportSecretKeys", "Where would you like to save your wallet?", nullptr));
        b1_okButton->setText(QCoreApplication::translate("ImportSecretKeys", "IMPORT", nullptr));
        b1_backButton->setText(QCoreApplication::translate("ImportSecretKeys", "CANCEL", nullptr));
    } // retranslateUi

};

namespace Ui {
    class ImportSecretKeys: public Ui_ImportSecretKeys {};
} // namespace Ui

QT_END_NAMESPACE

#endif // UI_IMPORTSECRETKEYS_H
