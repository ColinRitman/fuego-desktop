/********************************************************************************
** Form generated from reading UI file 'messagedetailsdialog.ui'
**
** Created by: Qt User Interface Compiler version 5.15.16
**
** WARNING! All changes made in this file will be lost when recompiling UI file!
********************************************************************************/

#ifndef UI_MESSAGEDETAILSDIALOG_H
#define UI_MESSAGEDETAILSDIALOG_H

#include <QtCore/QVariant>
#include <QtWidgets/QApplication>
#include <QtWidgets/QDialog>
#include <QtWidgets/QFrame>
#include <QtWidgets/QGridLayout>
#include <QtWidgets/QHBoxLayout>
#include <QtWidgets/QLabel>
#include <QtWidgets/QPushButton>
#include <QtWidgets/QSpacerItem>
#include <QtWidgets/QTextEdit>
#include <QtWidgets/QVBoxLayout>

QT_BEGIN_NAMESPACE

class Ui_MessageDetailsDialog
{
public:
    QVBoxLayout *verticalLayout;
    QLabel *title_label;
    QFrame *frame;
    QGridLayout *gridLayout;
    QLabel *label;
    QLabel *m_heightLabel;
    QLabel *label_5;
    QLabel *m_hashLabel;
    QLabel *m_amountLabel;
    QLabel *label_3;
    QLabel *label_7;
    QLabel *m_sizeLabel;
    QTextEdit *m_messageTextEdit;
    QHBoxLayout *horizontalLayout;
    QPushButton *b1_saveButton;
    QSpacerItem *horizontalSpacer;
    QPushButton *b1_prevButton;
    QPushButton *b1_nextButton;
    QPushButton *b1_okButton;

    void setupUi(QDialog *MessageDetailsDialog)
    {
        if (MessageDetailsDialog->objectName().isEmpty())
            MessageDetailsDialog->setObjectName(QString::fromUtf8("MessageDetailsDialog"));
        MessageDetailsDialog->resize(705, 493);
        MessageDetailsDialog->setStyleSheet(QString::fromUtf8("background-color: #282d31;\n"
"color: #ddd;"));
        verticalLayout = new QVBoxLayout(MessageDetailsDialog);
        verticalLayout->setObjectName(QString::fromUtf8("verticalLayout"));
        title_label = new QLabel(MessageDetailsDialog);
        title_label->setObjectName(QString::fromUtf8("title_label"));
        title_label->setMinimumSize(QSize(0, 31));
        QFont font;
        font.setFamily(QString::fromUtf8("Poppins"));
        title_label->setFont(font);
        title_label->setStyleSheet(QString::fromUtf8("color: #ddd;\n"
"  border-right: 0px;\n"
"  font-size: 20px;\n"
"  "));
        title_label->setAlignment(Qt::AlignCenter);

        verticalLayout->addWidget(title_label);

        frame = new QFrame(MessageDetailsDialog);
        frame->setObjectName(QString::fromUtf8("frame"));
        frame->setFrameShape(QFrame::NoFrame);
        frame->setFrameShadow(QFrame::Raised);
        gridLayout = new QGridLayout(frame);
        gridLayout->setObjectName(QString::fromUtf8("gridLayout"));
        gridLayout->setHorizontalSpacing(20);
        label = new QLabel(frame);
        label->setObjectName(QString::fromUtf8("label"));
        QFont font1;
        font1.setFamily(QString::fromUtf8("Poppins"));
        font1.setPointSize(9);
        label->setFont(font1);

        gridLayout->addWidget(label, 0, 0, 1, 1);

        m_heightLabel = new QLabel(frame);
        m_heightLabel->setObjectName(QString::fromUtf8("m_heightLabel"));
        m_heightLabel->setFont(font1);

        gridLayout->addWidget(m_heightLabel, 0, 1, 1, 1);

        label_5 = new QLabel(frame);
        label_5->setObjectName(QString::fromUtf8("label_5"));
        label_5->setFont(font1);

        gridLayout->addWidget(label_5, 2, 0, 1, 1);

        m_hashLabel = new QLabel(frame);
        m_hashLabel->setObjectName(QString::fromUtf8("m_hashLabel"));
        m_hashLabel->setFont(font1);

        gridLayout->addWidget(m_hashLabel, 1, 1, 1, 1);

        m_amountLabel = new QLabel(frame);
        m_amountLabel->setObjectName(QString::fromUtf8("m_amountLabel"));
        m_amountLabel->setFont(font1);

        gridLayout->addWidget(m_amountLabel, 2, 1, 1, 1);

        label_3 = new QLabel(frame);
        label_3->setObjectName(QString::fromUtf8("label_3"));
        label_3->setFont(font1);

        gridLayout->addWidget(label_3, 1, 0, 1, 1);

        label_7 = new QLabel(frame);
        label_7->setObjectName(QString::fromUtf8("label_7"));
        label_7->setFont(font1);

        gridLayout->addWidget(label_7, 3, 0, 1, 1);

        m_sizeLabel = new QLabel(frame);
        m_sizeLabel->setObjectName(QString::fromUtf8("m_sizeLabel"));
        m_sizeLabel->setFont(font1);

        gridLayout->addWidget(m_sizeLabel, 3, 1, 1, 1);

        gridLayout->setColumnStretch(1, 1);

        verticalLayout->addWidget(frame);

        m_messageTextEdit = new QTextEdit(MessageDetailsDialog);
        m_messageTextEdit->setObjectName(QString::fromUtf8("m_messageTextEdit"));
        m_messageTextEdit->setStyleSheet(QString::fromUtf8(""));
        m_messageTextEdit->setReadOnly(true);

        verticalLayout->addWidget(m_messageTextEdit);

        horizontalLayout = new QHBoxLayout();
        horizontalLayout->setObjectName(QString::fromUtf8("horizontalLayout"));
        b1_saveButton = new QPushButton(MessageDetailsDialog);
        b1_saveButton->setObjectName(QString::fromUtf8("b1_saveButton"));
        b1_saveButton->setMinimumSize(QSize(121, 31));
        b1_saveButton->setFont(font);
        b1_saveButton->setStyleSheet(QString::fromUtf8("/* This style is handled automatically by EditableStyle.cpp */"));

        horizontalLayout->addWidget(b1_saveButton);

        horizontalSpacer = new QSpacerItem(40, 20, QSizePolicy::Expanding, QSizePolicy::Minimum);

        horizontalLayout->addItem(horizontalSpacer);

        b1_prevButton = new QPushButton(MessageDetailsDialog);
        b1_prevButton->setObjectName(QString::fromUtf8("b1_prevButton"));
        b1_prevButton->setMinimumSize(QSize(121, 31));
        b1_prevButton->setFont(font);
        b1_prevButton->setStyleSheet(QString::fromUtf8("/* This style is handled automatically by EditableStyle.cpp */"));

        horizontalLayout->addWidget(b1_prevButton);

        b1_nextButton = new QPushButton(MessageDetailsDialog);
        b1_nextButton->setObjectName(QString::fromUtf8("b1_nextButton"));
        b1_nextButton->setMinimumSize(QSize(121, 31));
        b1_nextButton->setFont(font);
        b1_nextButton->setStyleSheet(QString::fromUtf8("/* This style is handled automatically by EditableStyle.cpp */"));

        horizontalLayout->addWidget(b1_nextButton);

        b1_okButton = new QPushButton(MessageDetailsDialog);
        b1_okButton->setObjectName(QString::fromUtf8("b1_okButton"));
        b1_okButton->setMinimumSize(QSize(121, 31));
        b1_okButton->setFont(font);
        b1_okButton->setStyleSheet(QString::fromUtf8("/* This style is handled automatically by EditableStyle.cpp */"));
        b1_okButton->setAutoDefault(true);

        horizontalLayout->addWidget(b1_okButton);


        verticalLayout->addLayout(horizontalLayout);


        retranslateUi(MessageDetailsDialog);
        QObject::connect(b1_okButton, SIGNAL(clicked()), MessageDetailsDialog, SLOT(reject()));
        QObject::connect(b1_prevButton, SIGNAL(clicked()), MessageDetailsDialog, SLOT(prevClicked()));
        QObject::connect(b1_nextButton, SIGNAL(clicked()), MessageDetailsDialog, SLOT(nextClicked()));
        QObject::connect(b1_saveButton, SIGNAL(clicked()), MessageDetailsDialog, SLOT(saveClicked()));

        b1_okButton->setDefault(true);


        QMetaObject::connectSlotsByName(MessageDetailsDialog);
    } // setupUi

    void retranslateUi(QDialog *MessageDetailsDialog)
    {
        MessageDetailsDialog->setWindowTitle(QCoreApplication::translate("MessageDetailsDialog", "Message", nullptr));
        title_label->setText(QCoreApplication::translate("MessageDetailsDialog", "MESSAGE DETAILS", nullptr));
        label->setText(QCoreApplication::translate("MessageDetailsDialog", "Block height", nullptr));
        m_heightLabel->setText(QString());
        label_5->setText(QCoreApplication::translate("MessageDetailsDialog", "Amount", nullptr));
        m_hashLabel->setText(QString());
        m_amountLabel->setText(QString());
        label_3->setText(QCoreApplication::translate("MessageDetailsDialog", "Transaction hash", nullptr));
        label_7->setText(QCoreApplication::translate("MessageDetailsDialog", "Message size (bytes)", nullptr));
        m_sizeLabel->setText(QString());
        b1_saveButton->setText(QCoreApplication::translate("MessageDetailsDialog", "SAVE TO FILE", nullptr));
        b1_prevButton->setText(QCoreApplication::translate("MessageDetailsDialog", "<<", nullptr));
        b1_nextButton->setText(QCoreApplication::translate("MessageDetailsDialog", ">>", nullptr));
        b1_okButton->setText(QCoreApplication::translate("MessageDetailsDialog", "OK", nullptr));
    } // retranslateUi

};

namespace Ui {
    class MessageDetailsDialog: public Ui_MessageDetailsDialog {};
} // namespace Ui

QT_END_NAMESPACE

#endif // UI_MESSAGEDETAILSDIALOG_H
